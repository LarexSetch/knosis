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
import {
  isValidOntologyId,
  type OntologyStorage,
} from './ontology-storage.interface';
import {
  isOntologyDocument,
  normalizeOntologyDocument,
} from './ontology-document.validator';
import type { OntologyDocument } from './ontology.types';

@Injectable()
export class FileOntologyStorageService implements OntologyStorage {
  private readonly storageDirectory = resolve(
    process.env.ONTOLOGY_STORAGE_DIR ?? resolve(__dirname, '../../../storage'),
  );

  async save(id: string, ontology: OntologyDocument): Promise<void> {
    const filePath = this.getFilePath(id);
    if (!isOntologyDocument(ontology)) {
      throw new Error('Cannot save an invalid ontology document.');
    }
    await mkdir(dirname(filePath), { recursive: true });

    const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(ontology, null, 2)}\n`, {
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
          'Failed to save ontology and clean up its temporary file.',
        );
      }
      throw error;
    }
  }

  async load(id: string): Promise<OntologyDocument | null> {
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
        `Stored ontology "${id}" contains invalid JSON.`,
        { cause: error },
      );
    }

    const ontology = normalizeOntologyDocument(parsed);
    if (!isOntologyDocument(ontology)) {
      throw new Error(`Stored ontology "${id}" has an invalid document shape.`);
    }
    return ontology;
  }

  private getFilePath(id: string): string {
    if (!isValidOntologyId(id)) {
      throw new Error(
        'Ontology id must start with a letter or digit and contain only letters, digits, "_" or "-".',
      );
    }
    return join(this.storageDirectory, `${id}.json`);
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}
