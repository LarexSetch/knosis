import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service';
import { OntologyEntity } from '../ontology/ontology.entity';
import type {
  CreateKnowledgeRequest,
  DeleteKnowledgeRequest,
  GetKnowledgeRequest,
  UpdateKnowledgeRequest,
} from './dto/requests.dto';
import type {
  CreateKnowledgeResponse,
  GetKnowledgeResponse,
  ListKnowledgeResponse,
  KnowledgeSummaryItem,
  UpdateKnowledgeResponse,
} from './dto/responses.dto';
import type { KnowlageGraph } from './dto/graph.dto';
import { KnowledgeEntity } from './knowledge.entity';
import { GraphServiceImpl } from './knowlage.service';

@Controller(['knowledge', 'knowlage'])
export class KnowledgeController {
  constructor(
    @InjectRepository(KnowledgeEntity)
    private readonly knowledgeRepository: Repository<KnowledgeEntity>,
    @InjectRepository(OntologyEntity)
    private readonly ontologyRepository: Repository<OntologyEntity>,
    private readonly databaseService: DatabaseService,
  ) {}

  @Post()
  async create(
    @Body() request: CreateKnowledgeRequest,
  ): Promise<CreateKnowledgeResponse> {
    const id = request.id || request.document?.id || request.graph?.id || randomUUID();
    const name = request.name || request.document?.name || request.graph?.name || '';
    const summary = request.summary ?? request.document?.summary ?? request.graph?.summary ?? '';

    const entity = this.knowledgeRepository.create({
      id,
      name,
      summary,
    });
    const saved = await this.knowledgeRepository.save(entity);

    const graphData: KnowlageGraph | undefined =
      request.document ??
      request.graph ??
      (request.nodes
        ? {
            id: saved.id,
            name: saved.name,
            summary: saved.summary,
            nodes: request.nodes,
            relations: request.relations || [],
            contexts: request.contexts || [],
          }
        : undefined);

    if (graphData) {
      await this.processGraphData(saved, graphData);
    }

    return this.toCreateResponse(saved);
  }

  @Get()
  async findAll(): Promise<ListKnowledgeResponse> {
    const entities = await this.knowledgeRepository.find({
      order: {
        updated_at: 'DESC',
      },
    });
    const items: KnowledgeSummaryItem[] = entities.map((entity) => ({
      id: entity.id,
      name: entity.name,
      summary: entity.summary,
      createdAt: this.toIsoString(entity.created_at),
      updatedAt: this.toIsoString(entity.updated_at),
    }));

    return { items, total: items.length };
  }

  @Get(':id')
  async findById(@Param() request: GetKnowledgeRequest): Promise<GetKnowledgeResponse> {
    const entity = await this.knowledgeRepository.findOne({
      where: { id: request.id },
    });
    if (!entity) {
      throw new NotFoundException(`Knowledge "${request.id}" was not found`);
    }

    return this.toGetResponse(entity);
  }

  @Get(':id/graph')
  async getGraph(@Param() request: GetKnowledgeRequest): Promise<KnowlageGraph> {
    const entity = await this.knowledgeRepository.findOne({
      where: { id: request.id },
    });
    if (!entity) {
      throw new NotFoundException(`Knowledge "${request.id}" was not found`);
    }

    const ontology = (await this.ontologyRepository.find({ take: 1 }))[0] ?? null;
    const graphService = new GraphServiceImpl(entity, ontology, this.databaseService);
    return graphService.document();
  }

  @Put(':id')
  async update(
    @Param() params: GetKnowledgeRequest,
    @Body() request: UpdateKnowledgeRequest,
  ): Promise<UpdateKnowledgeResponse> {
    const entity = await this.knowledgeRepository.findOne({
      where: { id: params.id },
    });
    if (!entity) {
      throw new NotFoundException(`Knowledge "${params.id}" was not found`);
    }

    if (request.name !== undefined) {
      entity.name = request.name;
    }
    if (request.summary !== undefined) {
      entity.summary = request.summary;
    }

    const saved = await this.knowledgeRepository.save(entity);

    const graphData: KnowlageGraph | undefined =
      request.document ??
      request.graph ??
      (request.nodes
        ? {
            id: saved.id,
            name: saved.name,
            summary: saved.summary,
            nodes: request.nodes,
            relations: request.relations || [],
            contexts: request.contexts || [],
          }
        : undefined);

    if (graphData) {
      await this.processGraphData(saved, graphData);
    }

    return this.toUpdateResponse(saved);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param() request: DeleteKnowledgeRequest): Promise<void> {
    const result = await this.knowledgeRepository.delete(request.id);
    if (!result.affected) {
      throw new NotFoundException(`Knowledge "${request.id}" was not found`);
    }
  }

  private async processGraphData(knowledge: KnowledgeEntity, graphData: KnowlageGraph): Promise<void> {
    const ontologyId = graphData.nodes?.[0]?.ontology?.id || graphData.relations?.[0]?.ontology?.id;
    let ontology: OntologyEntity | null = null;
    if (ontologyId) {
      ontology = await this.ontologyRepository.findOne({ where: { id: ontologyId } });
    }
    if (!ontology) {
      const all = await this.ontologyRepository.find({ take: 1 });
      ontology = all[0] ?? null;
    }

    if (ontology) {
      const graphService = new GraphServiceImpl(knowledge, ontology, this.databaseService);
      await graphService.saveGraph(graphData);
    }
  }

  private toCreateResponse(entity: KnowledgeEntity): CreateKnowledgeResponse {
    return {
      id: entity.id,
      name: entity.name,
      summary: entity.summary,
      createdAt: this.toIsoString(entity.created_at),
      updatedAt: this.toIsoString(entity.updated_at),
    };
  }

  private toGetResponse(entity: KnowledgeEntity): GetKnowledgeResponse {
    return {
      id: entity.id,
      name: entity.name,
      summary: entity.summary,
      createdAt: this.toIsoString(entity.created_at),
      updatedAt: this.toIsoString(entity.updated_at),
    };
  }

  private toUpdateResponse(entity: KnowledgeEntity): UpdateKnowledgeResponse {
    return {
      id: entity.id,
      name: entity.name,
      summary: entity.summary,
      createdAt: this.toIsoString(entity.created_at),
      updatedAt: this.toIsoString(entity.updated_at),
    };
  }

  private toIsoString(value: Date | string): string {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }
}
