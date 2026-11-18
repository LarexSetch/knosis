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
import { KnowledgeEntity } from './knowledge.entity';

@Controller(['knowledge', 'knowlage'])
export class KnowledgeController {
  constructor(
    @InjectRepository(KnowledgeEntity)
    private readonly knowledgeRepository: Repository<KnowledgeEntity>,
  ) {}

  @Post()
  async create(
    @Body() request: CreateKnowledgeRequest,
  ): Promise<CreateKnowledgeResponse> {
    // KnowledgeGraphDocument data is received here, but not saved directly into the knowledge entity
    // (reserved for graph interface/algorithm).
      // Future graph processing algorithm/interface hook:
      // await this.graphService.process(id, graphData);

    const entity = this.knowledgeRepository.create({
      id: randomUUID(),
      name: request.name,
      summary: request.summary,
    });
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

    // Graph document data handling hook
    // Future graph processing algorithm/interface hook

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
