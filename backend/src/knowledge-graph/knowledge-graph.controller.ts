import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Put,
} from '@nestjs/common';
import { isKnowledgeGraphDocument } from './knowledge-graph.validator';
import {
  isValidKnowledgeGraphId,
  KNOWLEDGE_GRAPH_STORAGE,
  type KnowledgeGraphStorage,
} from './knowledge-graph-storage.interface';
import type { KnowledgeGraphDocument } from './knowledge-graph.types';

@Controller('knowledge-graphs')
export class KnowledgeGraphController {
  constructor(
    @Inject(KNOWLEDGE_GRAPH_STORAGE)
    private readonly knowledgeGraphStorage: KnowledgeGraphStorage,
  ) {}

  @Put(':id')
  async save(@Param('id') id: string, @Body() body: unknown): Promise<void> {
    this.validateId(id);
    if (!isKnowledgeGraphDocument(body)) {
      throw new BadRequestException(
        'Request body is not a valid knowledge graph document.',
      );
    }
    await this.knowledgeGraphStorage.save(id, body);
  }

  @Get(':id')
  async load(@Param('id') id: string): Promise<KnowledgeGraphDocument> {
    this.validateId(id);
    const graph = await this.knowledgeGraphStorage.load(id);
    if (graph === null) {
      throw new NotFoundException(`Knowledge graph "${id}" was not found.`);
    }
    return graph;
  }

  private validateId(id: string): void {
    if (!isValidKnowledgeGraphId(id)) {
      throw new BadRequestException('Invalid knowledge graph id.');
    }
  }
}
