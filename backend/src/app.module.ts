import { Module } from '@nestjs/common';
import { KnowledgeGraphModule } from './knowledge-graph/knowledge-graph.module';
import { OntologyModule } from './ontology/ontology.module';

@Module({
  imports: [OntologyModule, KnowledgeGraphModule],
})
export class AppModule {}
