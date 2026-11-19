import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OntologyEntity } from '../ontology/ontology.entity';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeEntity } from './knowledge.entity';

@Module({
  imports: [TypeOrmModule.forFeature([KnowledgeEntity, OntologyEntity])],
  controllers: [KnowledgeController],
  exports: [TypeOrmModule],
})
export class KnowledgeModule {}
