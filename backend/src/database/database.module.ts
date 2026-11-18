import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from './database.service';
import { MigrationService } from './migration.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST ?? 'localhost',
      port: Number(process.env.POSTGRES_PORT ?? 5432),
      username: process.env.POSTGRES_USER ?? 'knosis',
      password: process.env.POSTGRES_PASSWORD ?? 'knosis_secret',
      database: process.env.POSTGRES_DB ?? 'knosis',
      autoLoadEntities: true,
      synchronize: false,
    }),
  ],
  providers: [DatabaseService, MigrationService],
  exports: [DatabaseService, MigrationService, TypeOrmModule],
})
export class DatabaseModule {}
