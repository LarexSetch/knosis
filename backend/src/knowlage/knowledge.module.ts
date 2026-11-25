import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from '../database/database.service';
import { OntologyEntity } from '../ontology/ontology.entity';
import { KnowledgeController } from './knowledge.controller';
import { GRAPH_SERVICE_TOKEN, GraphServiceImpl } from './knowlage.service';
import { KnowledgeEntity } from './knowledge.entity';
import { ImportController } from './import/import.controller';
import { KnowledgeImportEntity } from './import/import.entity';

@Module({
  imports: [TypeOrmModule.forFeature([KnowledgeEntity, OntologyEntity, KnowledgeImportEntity])],
  controllers: [KnowledgeController, ImportController],
  providers: [
    DatabaseService,
    {
      provide: GRAPH_SERVICE_TOKEN,
      useClass: GraphServiceImpl,
    },
  ],
  exports: [TypeOrmModule, GRAPH_SERVICE_TOKEN],
})
export class KnowledgeModule {}
