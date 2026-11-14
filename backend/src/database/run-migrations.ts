import { DatabaseService } from './database.service';
import { MigrationService } from './migration.service';

async function main() {
  console.log('Running database migrations...');
  const db = new DatabaseService();
  const migrator = new MigrationService(db);

  try {
    const applied = await migrator.runMigrations();
    console.log(`Finished. Applied ${applied.length} migration(s).`);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await db.onModuleDestroy();
  }
}

void main();
