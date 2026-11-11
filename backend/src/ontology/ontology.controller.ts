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
import {
  isOntologyDocument,
  normalizeOntologyDocument,
} from './ontology-document.validator';
import {
  isValidOntologyId,
  ONTOLOGY_STORAGE,
  type OntologyStorage,
} from './ontology-storage.interface';
import type { OntologyDocument } from './ontology.types';

@Controller('ontologies')
export class OntologyController {
  constructor(
    @Inject(ONTOLOGY_STORAGE)
    private readonly ontologyStorage: OntologyStorage,
  ) {}

  @Put(':id')
  async save(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<void> {
    this.validateId(id);
    const ontology = normalizeOntologyDocument(body);
    if (!isOntologyDocument(ontology)) {
      throw new BadRequestException('Request body is not a valid ontology document.');
    }
    await this.ontologyStorage.save(id, ontology);
  }

  @Get(':id')
  async load(@Param('id') id: string): Promise<OntologyDocument> {
    this.validateId(id);
    const ontology = await this.ontologyStorage.load(id);
    if (ontology === null) {
      throw new NotFoundException(`Ontology "${id}" was not found.`);
    }
    return ontology;
  }

  private validateId(id: string): void {
    if (!isValidOntologyId(id)) {
      throw new BadRequestException('Invalid ontology id.');
    }
  }
}
