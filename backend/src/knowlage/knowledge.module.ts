import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from '../database/database.service';
import { OntologyEntity } from '../ontology/ontology.entity';
import { KnowledgeController } from './knowledge.controller';
import { GRAPH_SERVICE_TOKEN, GraphServiceImpl } from './knowlage.service';
import { KnowledgeEntity } from './knowledge.entity';

@Module({
  imports: [TypeOrmModule.forFeature([KnowledgeEntity, OntologyEntity])],
  controllers: [KnowledgeController],
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
