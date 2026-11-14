import {
  BadRequestException,
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
import { OntologyService } from './ontology.service';
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
import type { OntologyEntity } from './ontology.entity';

@Controller('ontology')
export class OntologyController {
  constructor(private readonly ontologyService: OntologyService) {}

  @Post()
  async create(
    @Body() request: CreateOntologyRequest,
  ): Promise<CreateOntologyResponse> {
    return this.toCreateResponse(await this.ontologyService.create(request));
  }

  @Get()
  async findAll(): Promise<ListOntologiesResponse> {
    const entities = await this.ontologyService.findAll();
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
    const entity = await this.ontologyService.findById(request.id);
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
    const entity = await this.ontologyService.update(params.id, request);
    if (!entity) {
      throw new NotFoundException(`Ontology "${params.id}" was not found`);
    }

    return this.toUpdateResponse(entity);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param() request: DeleteOntologyRequest): Promise<void> {
    const deleted = await this.ontologyService.delete(request.id);
    if (!deleted) {
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
