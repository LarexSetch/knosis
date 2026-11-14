import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import type { Document } from './dto/ontology.dto';
import type { OntologyEntity } from './ontology.entity';

export interface CreateOntologyCommand {
  id?: string;
  name: string;
  data: Document;
}

export interface UpdateOntologyCommand {
  name?: string;
  data?: Document;
}

@Injectable()
export class OntologyService {
  constructor(private readonly db: DatabaseService) {}

  async create(command: CreateOntologyCommand): Promise<OntologyEntity> {
    const id = command.id || randomUUID();

    const query = `
      INSERT INTO ontology (id, name, data, created_at, updated_at)
      VALUES ($1, $2, $3::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          data = EXCLUDED.data,
          updated_at = CURRENT_TIMESTAMP
      RETURNING id, name, data, created_at, updated_at;
    `;

    const result = await this.db.query<OntologyEntity>(query, [
      id,
      command.name,
      JSON.stringify(command.data),
    ]);

    return result.rows[0];
  }

  async findAll(): Promise<OntologyEntity[]> {
    const query = `
      SELECT id, name, data, created_at, updated_at
      FROM ontology
      ORDER BY updated_at DESC;
    `;
    const result = await this.db.query<OntologyEntity>(query);
    return result.rows;
  }

  async findById(id: string): Promise<OntologyEntity | null> {
    const query = `
      SELECT id, name, data, created_at, updated_at
      FROM ontology
      WHERE id = $1;
    `;
    const result = await this.db.query<OntologyEntity>(query, [id]);
    return result.rows[0] ?? null;
  }

  async update(id: string, command: UpdateOntologyCommand): Promise<OntologyEntity | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    const name = command.name ?? existing.name;
    const data = command.data ?? existing.data;

    const query = `
      UPDATE ontology
      SET name = $1,
          data = $2::jsonb,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, name, data, created_at, updated_at;
    `;

    const result = await this.db.query<OntologyEntity>(query, [
      name,
      JSON.stringify(data),
      id,
    ]);

    return result.rows[0] ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const query = `
      DELETE FROM ontology
      WHERE id = $1
      RETURNING id;
    `;
    const result = await this.db.query<{ id: string }>(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }
}
