import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { DatabaseService } from './database.service';

@Injectable()
export class MigrationService implements OnModuleInit {
  private readonly logger = new Logger(MigrationService.name);

  constructor(private readonly db: DatabaseService) {}

  async onModuleInit(): Promise<void> {
    if (process.env.AUTO_MIGRATE !== 'false') {
      await this.runMigrations();
    }
  }

  async runMigrations(): Promise<string[]> {
    this.logger.log('Checking database migrations...');
    const client = await this.db.getClient();

    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS _migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      const appliedResult = await client.query<{ name: string }>(
        'SELECT name FROM _migrations ORDER BY id ASC;',
      );
      const appliedSet = new Set(appliedResult.rows.map((r) => r.name));

      const migrationsDir = this.findMigrationsDirectory();
      if (!migrationsDir) {
        this.logger.warn('Migrations directory not found, skipping migration check.');
        return [];
      }

      const files = await readdir(migrationsDir);
      const sqlFiles = files.filter((f) => f.endsWith('.sql')).sort();

      const appliedNow: string[] = [];

      for (const file of sqlFiles) {
        if (appliedSet.has(file)) {
          continue;
        }

        const filePath = join(migrationsDir, file);
        const sql = await readFile(filePath, 'utf-8');

        this.logger.log(`Applying migration: ${file}`);
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('INSERT INTO _migrations (name) VALUES ($1);', [file]);
          await client.query('COMMIT');
          appliedNow.push(file);
          this.logger.log(`Migration applied successfully: ${file}`);
        } catch (error) {
          await client.query('ROLLBACK');
          this.logger.error(`Migration failed: ${file}`, error);
          throw error;
        }
      }

      if (appliedNow.length === 0) {
        this.logger.log('Database schema is up to date.');
      }

      return appliedNow;
    } finally {
      client.release();
    }
  }

  private findMigrationsDirectory(): string | null {
    const candidatePaths = [
      join(__dirname, 'migrations'),
      resolve(process.cwd(), 'src/database/migrations'),
      resolve(process.cwd(), 'backend/src/database/migrations'),
      resolve(__dirname, '../../src/database/migrations'),
      resolve(__dirname, '../../../src/database/migrations'),
    ];

    for (const p of candidatePaths) {
      if (existsSync(p)) {
        return p;
      }
    }

    return null;
  }
}
