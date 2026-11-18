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
  CreateOntologyRequest,
  DeleteOntologyRequest,
  GetOntologyRequest,
  UpdateOntologyRequest,
} from './dto/requests.dto';
import type {
  CreateOntologyResponse,
  GetOntologyResponse,
  ListOntologiesResponse,
  OntologySummaryItem,
  UpdateOntologyResponse,
} from './dto/responses.dto';
import { OntologyEntity } from './ontology.entity';

@Controller('ontology')
export class OntologyController {
  constructor(
    @InjectRepository(OntologyEntity)
    private readonly ontologyRepository: Repository<OntologyEntity>,
  ) {}

  @Post()
  async create(
    @Body() request: CreateOntologyRequest,
  ): Promise<CreateOntologyResponse> {
    const id = request.id || randomUUID();
    const entity = this.ontologyRepository.create({
      id,
      name: request.name,
      data: request.data,
    });
    const saved = await this.ontologyRepository.save(entity);
    return this.toCreateResponse(saved);
  }

  @Get()
  async findAll(): Promise<ListOntologiesResponse> {
    const entities = await this.ontologyRepository.find({
      order: {
        updated_at: 'DESC',
      },
    });
    const items: OntologySummaryItem[] = entities.map(({ id, name, created_at, updated_at }) => ({
      id,
      name,
      createdAt: this.toIsoString(created_at),
      updatedAt: this.toIsoString(updated_at),
    }));

    return { items, total: items.length };
  }

  @Get(':id')
  async findById(@Param() request: GetOntologyRequest): Promise<GetOntologyResponse> {
    const entity = await this.ontologyRepository.findOne({
      where: { id: request.id },
    });
    if (!entity) {
      throw new NotFoundException(`Ontology "${request.id}" was not found`);
    }

    return this.toGetResponse(entity);
  }

  @Put(':id')
  async update(
    @Param() params: GetOntologyRequest,
    @Body() request: UpdateOntologyRequest,
  ): Promise<UpdateOntologyResponse> {
    const entity = await this.ontologyRepository.findOne({
      where: { id: params.id },
    });
    if (!entity) {
      throw new NotFoundException(`Ontology "${params.id}" was not found`);
    }

    if (request.name !== undefined) {
      entity.name = request.name;
    }
    if (request.data !== undefined) {
      entity.data = request.data;
    }

    const saved = await this.ontologyRepository.save(entity);
    return this.toUpdateResponse(saved);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param() request: DeleteOntologyRequest): Promise<void> {
    const result = await this.ontologyRepository.delete(request.id);
    if (!result.affected) {
      throw new NotFoundException(`Ontology "${request.id}" was not found`);
    }
  }

  private toCreateResponse(entity: OntologyEntity): CreateOntologyResponse {
    return {
      id: entity.id,
      name: entity.name,
      data: entity.data,
      createdAt: this.toIsoString(entity.created_at),
      updatedAt: this.toIsoString(entity.updated_at),
    };
  }

  private toGetResponse(entity: OntologyEntity): GetOntologyResponse {
    return {
      id: entity.id,
      name: entity.name,
      data: entity.data,
      createdAt: this.toIsoString(entity.created_at),
      updatedAt: this.toIsoString(entity.updated_at),
    };
  }

  private toUpdateResponse(entity: OntologyEntity): UpdateOntologyResponse {
    return {
      id: entity.id,
      name: entity.name,
      data: entity.data,
      createdAt: this.toIsoString(entity.created_at),
      updatedAt: this.toIsoString(entity.updated_at),
    };
  }

  private toIsoString(value: Date | string): string {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }
}
