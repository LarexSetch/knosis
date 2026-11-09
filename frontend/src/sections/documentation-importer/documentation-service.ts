const STORAGE_KEY = 'knosis.documentation-documents';

export interface DocumentationDocument {
  id: string;
  name: string;
  markdown: string;
}

export interface DocumentationHeading {
  index: number;
  level: number;
  title: string;
  children: DocumentationHeading[];
}

export function loadDocumentationDocuments(): DocumentationDocument[] {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === null) {
    return [];
  }

  const parsed: unknown = JSON.parse(saved);
  if (!Array.isArray(parsed)) {
    throw new Error('Сохранённый список документов имеет неверный формат.');
  }

  return parsed.map((item: unknown) => {
    if (
      typeof item !== 'object'
      || item === null
      || !('id' in item)
      || typeof item.id !== 'string'
      || !('name' in item)
      || typeof item.name !== 'string'
      || !('markdown' in item)
      || typeof item.markdown !== 'string'
    ) {
      throw new Error('Сохранённый документ имеет неверный формат.');
    }

    return { id: item.id, name: item.name, markdown: item.markdown };
  });
}

export function saveDocumentationDocuments(
  documents: DocumentationDocument[],
): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
}

export function prepareMarkdownForEditor(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const definitions = new Map<string, string>();
  const definitionLines = new Set<number>();
  let fence: { character: string; length: number } | null = null;

  lines.forEach((line, index) => {
    const fenceStart = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (fence) {
      const fenceEnd = line.match(/^ {0,3}(`+|~+)[ \t]*$/);
      if (
        fenceEnd
        && fenceEnd[1][0] === fence.character
        && fenceEnd[1].length >= fence.length
      ) {
        fence = null;
      }
      return;
    }

    if (fenceStart) {
      fence = { character: fenceStart[1][0], length: fenceStart[1].length };
      return;
    }

    const definition = line.match(
      /^ {0,3}\[([^\]]+)\]:[ \t]*(?:<([^>\r\n]+)>|(\S+))(?:[ \t]+(?:"[^"]*"|'[^']*'|\([^)]*\)))?[ \t]*$/,
    );
    if (definition) {
      definitions.set(
        normalizeReference(definition[1]),
        definition[2] ?? definition[3],
      );
      definitionLines.add(index);
    }
  });

  fence = null;
  const preparedLines: string[] = [];
  lines.forEach((line, index) => {
    const fenceStart = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (fence) {
      preparedLines.push(line);
      const fenceEnd = line.match(/^ {0,3}(`+|~+)[ \t]*$/);
      if (
        fenceEnd
        && fenceEnd[1][0] === fence.character
        && fenceEnd[1].length >= fence.length
      ) {
        fence = null;
      }
      return;
    }

    if (fenceStart) {
      fence = { character: fenceStart[1][0], length: fenceStart[1].length };
      preparedLines.push(line);
      return;
    }

    if (definitionLines.has(index)) {
      return;
    }

    preparedLines.push(
      line.replace(
        /!\[([^\]]*)\](?:\[([^\]]*)\])?(?!\()/g,
        (match, altText: string, referenceLabel?: string) => {
          const label = normalizeReference(referenceLabel || altText);
          const url = definitions.get(label);
          return url ? `![${altText}](<${url}>)` : match;
        },
      ),
    );
  });

  return preparedLines.join('\n');
}

function normalizeReference(label: string): string {
  return label.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function parseDocumentationHeadings(
  markdown: string,
): DocumentationHeading[] {
  const headings: DocumentationHeading[] = [];
  const stack: DocumentationHeading[] = [];
  const lines = markdown.split(/\r?\n/);
  let fence: { character: string; length: number } | null = null;
  let headingIndex = 0;

  const appendHeading = (level: number, rawTitle: string) => {
    const title = rawTitle
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/(`+)(.*?)\1/g, '$2')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/[*_~]/g, '')
      .trim() || 'Без названия';
    const heading: DocumentationHeading = {
      index: headingIndex,
      level,
      title,
      children: [],
    };
    headingIndex += 1;

    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    const parent = stack[stack.length - 1];
    if (parent) {
      parent.children.push(heading);
    } else {
      headings.push(heading);
    }
    stack.push(heading);
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const fenceStart = line.match(/^ {0,3}(`{3,}|~{3,})/);

    if (fence) {
      const fenceEnd = line.match(/^ {0,3}(`+|~+)[ \t]*$/);
      if (
        fenceEnd
        && fenceEnd[1][0] === fence.character
        && fenceEnd[1].length >= fence.length
      ) {
        fence = null;
      }
      continue;
    }

    if (fenceStart) {
      fence = { character: fenceStart[1][0], length: fenceStart[1].length };
      continue;
    }

    const atxHeading = line.match(/^ {0,3}(#{1,6})(?:[ \t]+(.*)|[ \t]*)$/);
    if (atxHeading) {
      appendHeading(
        atxHeading[1].length,
        (atxHeading[2] ?? '').replace(/[ \t]+#+[ \t]*$/, ''),
      );
      continue;
    }

    const setextHeading = lines[index + 1]?.match(/^ {0,3}(=+|-+)[ \t]*$/);
    if (
      line.trim()
      && setextHeading
      && !/^ {4}/.test(line)
      && !/^(?: {0,3})(?:[-*+]|\d+[.)]|>|`)/.test(line)
    ) {
      appendHeading(setextHeading[1][0] === '=' ? 1 : 2, line.trim());
      index += 1;
    }
  }

  return headings;
}
