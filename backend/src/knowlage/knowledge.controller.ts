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
import type { KnowledgeGraph } from './dto/graph.dto';
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
    const entity = this.knowledgeRepository.create({id: randomUUID(), name: request.name, summary: request.summary});
    const saved = await this.knowledgeRepository.save(entity);

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
  async getGraph(@Param() request: GetKnowledgeRequest): Promise<KnowledgeGraph> {
    const entity = await this.knowledgeRepository.findOne({
      where: { id: request.id },
    });
    if (!entity) {
      throw new NotFoundException(`Knowledge "${request.id}" was not found`);
    }

    const ontology = (await this.ontologyRepository.find({ take: 1 }))[0] ?? null;
    const graphService = new GraphServiceImpl(entity, ontology, this.databaseService);

    const [nodes, relations, contexts, contextRelations] = await Promise.all([
      graphService.findNodes(),
      graphService.findRelations(),
      graphService.findContexts(),
      graphService.findContextRelations(),
    ]);

    return {
      id: entity.id,
      ontologyId: ontology?.id ?? '',
      name: entity.name,
      summary: entity.summary,
      nodes,
      relations,
      contexts,
      contextRelations,
    };
  }


  @Put(':id/graph')
  @HttpCode(HttpStatus.NO_CONTENT)
  async putGraph(@Param() request: GetKnowledgeRequest, @Body() graph: KnowledgeGraph): Promise<void> {
    const entity = await this.knowledgeRepository.findOne({
      where: { id: request.id },
    });
    if (!entity) {
      throw new NotFoundException(`Knowledge "${request.id}" was not found`);
    }

    const ontology = (await this.ontologyRepository.find({ take: 1 }))[0] ?? null;
    const graphService = new GraphServiceImpl(entity, ontology, this.databaseService);

    graph.nodes.forEach((n) => graphService.createNode(n));
    graph.contexts.forEach((c) => graphService.contextualize(c, graph.contextRelations.filter((v) => v.contextId === c.id)));
    graph.relations.forEach((r) => graphService.relate(r))
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

    entity.name = request.name;
    entity.summary = request.summary;
    const saved = await this.knowledgeRepository.save(entity);

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
