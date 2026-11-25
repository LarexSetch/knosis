import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { KnowledgeEntity } from '../knowledge.entity';
import { OntologyEntity } from '../../ontology/ontology.entity';
import type { CreateKnowledgeImportRequest } from './dto/request.dto';
import type {
  CreateKnowledgeImportResponse,
  KnowledgeImportRelation,
  KnowledgeImportSummaryItem,
  ListKnowledgeImportsResponse,
} from './dto/response.dto';
import { ImportStatus, KnowledgeImportEntity } from './import.entity';

@Controller(['knowledge/import', 'knowlage/import'])
export class ImportController {
  constructor(
    @InjectRepository(KnowledgeImportEntity)
    private readonly importRepository: Repository<KnowledgeImportEntity>,
    @InjectRepository(OntologyEntity)
    private readonly ontologyRepository: Repository<OntologyEntity>,
    @InjectRepository(KnowledgeEntity)
    private readonly knowledgeRepository: Repository<KnowledgeEntity>,
  ) {}

  @Post()
  async create(
    @Body() request: CreateKnowledgeImportRequest,
  ): Promise<CreateKnowledgeImportResponse> {
    const ontology = await this.ontologyRepository.findOne({
      where: { id: request.ontologyId },
    });
    if (!ontology) {
      throw new NotFoundException(`Ontology "${request.ontologyId}" was not found`);
    }

    const knowledge = await this.knowledgeRepository.findOne({
      where: { id: request.knowledgeId },
    });
    if (!knowledge) {
      throw new NotFoundException(`Knowledge "${request.knowledgeId}" was not found`);
    }

    const entity = this.importRepository.create({
      id: randomUUID(),
      name: request.name,
      document: request.document,
      status: ImportStatus.PROCESSING,
      ontology,
      knowledge,
    });
    const saved = await this.importRepository.save(entity);

    return this.toCreateResponse(saved, ontology, knowledge);
  }

  @Get()
  async findAll(): Promise<ListKnowledgeImportsResponse> {
    const entities = await this.importRepository.find({
      relations: { ontology: true, knowledge: true },
      order: { updated_at: 'DESC' },
    });
    const items: KnowledgeImportSummaryItem[] = entities.map((entity) => ({
      id: entity.id,
      name: entity.name,
      status: entity.status,
      ontology: this.toRelation(entity.ontology),
      knowledge: this.toRelation(entity.knowledge),
      createdAt: this.toIsoString(entity.created_at),
      updatedAt: this.toIsoString(entity.updated_at),
    }));

    return { items, total: items.length };
  }

  private toCreateResponse(
    entity: KnowledgeImportEntity,
    ontology: OntologyEntity,
    knowledge: KnowledgeEntity,
  ): CreateKnowledgeImportResponse {
    return {
      id: entity.id,
      name: entity.name,
      document: entity.document,
      status: entity.status,
      ontology: this.toRelation(ontology),
      knowledge: this.toRelation(knowledge),
      createdAt: this.toIsoString(entity.created_at),
      updatedAt: this.toIsoString(entity.updated_at),
    };
  }

  private toRelation(entity: { id: string; name: string }): KnowledgeImportRelation {
    return { id: entity.id, name: entity.name };
  }

  private toIsoString(value: Date | string): string {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }
}
