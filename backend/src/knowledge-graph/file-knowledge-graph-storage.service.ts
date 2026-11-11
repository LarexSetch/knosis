import { randomUUID } from 'node:crypto';
import {
  access,
  mkdir,
  readFile,
  rename,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { Injectable } from '@nestjs/common';
import { isKnowledgeGraphDocument } from './knowledge-graph.validator';
import {
  isValidKnowledgeGraphId,
  type KnowledgeGraphStorage,
} from './knowledge-graph-storage.interface';
import type { KnowledgeGraphDocument } from './knowledge-graph.types';

@Injectable()
export class FileKnowledgeGraphStorageService implements KnowledgeGraphStorage {
  private readonly storageDirectory = resolve(
    process.env.KNOWLEDGE_GRAPH_STORAGE_DIR ??
      resolve(__dirname, '../../../storage/knowledge-graphs'),
  );

  async save(id: string, graph: KnowledgeGraphDocument): Promise<void> {
    const filePath = this.getFilePath(id);
    if (!isKnowledgeGraphDocument(graph)) {
      throw new Error('Cannot save an invalid knowledge graph document.');
    }
    await mkdir(dirname(filePath), { recursive: true });

    const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(graph, null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
    });
    try {
      await rename(temporaryPath, filePath);
    } catch (error) {
      try {
        await unlink(temporaryPath);
      } catch (cleanupError) {
        throw new AggregateError(
          [error, cleanupError],
          'Failed to save knowledge graph and clean up its temporary file.',
        );
      }
      throw error;
    }
  }

  async load(id: string): Promise<KnowledgeGraphDocument | null> {
    const filePath = this.getFilePath(id);
    try {
      await access(filePath);
    } catch (error) {
      if (isNodeError(error) && error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }

    let contents: string;
    try {
      contents = await readFile(filePath, 'utf8');
    } catch (error) {
      if (isNodeError(error) && error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(contents);
    } catch (error) {
      throw new Error(
        `Stored knowledge graph "${id}" contains invalid JSON.`,
        { cause: error },
      );
    }

    if (!isKnowledgeGraphDocument(parsed)) {
      throw new Error(`Stored knowledge graph "${id}" has an invalid document shape.`);
    }
    return parsed;
  }

  private getFilePath(id: string): string {
    if (!isValidKnowledgeGraphId(id)) {
      throw new Error(
        'Knowledge graph id must start with a letter or digit and contain only letters, digits, "_" or "-".',
      );
    }
    return join(this.storageDirectory, `${id}.json`);
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
