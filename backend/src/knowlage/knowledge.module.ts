import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from '../database/database.service';
import { OntologyEntity } from '../ontology/ontology.entity';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeEntity } from './knowledge.entity';
import { ImportController } from './import/import.controller';
import { KnowledgeImportEntity } from './import/import.entity';

@Module({
  imports: [TypeOrmModule.forFeature([KnowledgeEntity, OntologyEntity, KnowledgeImportEntity])],
  controllers: [KnowledgeController, ImportController],
  providers: [
    DatabaseService,
  ],
  exports: [TypeOrmModule],
})
export class KnowledgeModule {}
