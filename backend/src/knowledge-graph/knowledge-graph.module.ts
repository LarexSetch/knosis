import { Module } from '@nestjs/common';
import { FileKnowledgeGraphStorageService } from './file-knowledge-graph-storage.service';
import { KnowledgeGraphController } from './knowledge-graph.controller';
import { KNOWLEDGE_GRAPH_STORAGE } from './knowledge-graph-storage.interface';

@Module({
  controllers: [KnowledgeGraphController],
  providers: [
    FileKnowledgeGraphStorageService,
    {
      provide: KNOWLEDGE_GRAPH_STORAGE,
      useExisting: FileKnowledgeGraphStorageService,
    },
  ],
  exports: [KNOWLEDGE_GRAPH_STORAGE],
})
export class KnowledgeGraphModule {}
