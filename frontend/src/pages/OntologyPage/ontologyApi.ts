import { ontologyService, type OntologyService } from '../../api/ontologyService';
import type {
  CreateOntologyRequest,
  UpdateOntologyRequest,
} from '../../../../backend/src/ontology/dto/requests.dto';
import type {
  CreateOntologyResponse,
  GetOntologyResponse,
  OntologySummaryItem,
  UpdateOntologyResponse,
} from '../../../../backend/src/ontology/dto/responses.dto';
import { createEmptyDocument } from './mockData';
import type { OntologyContext, OntologyDocument, OntologyListItem } from './types';

export interface LoadedOntology {
  ontology: OntologyListItem;
  document: OntologyDocument;
}

export interface CreateOntologyParams {
  id?: string;
  name?: string;
  document?: OntologyDocument;
}

export interface UpdateOntologyParams {
  name?: string;
  document?: OntologyDocument;
}

type OntologyResponse = CreateOntologyResponse | GetOntologyResponse | UpdateOntologyResponse;

/**
 * Maps a backend summary or full ontology DTO to the sidebar list item shape.
 */
export function toOntologyListItem(
  source: Pick<OntologySummaryItem | OntologyResponse, 'id' | 'name'>,
): OntologyListItem {
  return {
    id: source.id,
    name: source.name,
  };
}

/**
 * Normalizes a backend document payload so all expected collections are present.
 */
export function toOntologyDocument(document?: Partial<OntologyDocument> | null): OntologyDocument {
  return {
    elements: document?.elements ?? [],
    relations: document?.relations ?? [],
    contexts: document?.contexts ?? [],
  };
}

/**
 * Extracts page-ready ontology metadata and document from a full backend response.
 */
export function toLoadedOntology(response: OntologyResponse): LoadedOntology {
  return {
    ontology: toOntologyListItem(response),
    document: toOntologyDocument(response.data),
  };
}

/**
 * Builds a `CreateOntologyRequest` payload with sensible page defaults.
 */
export function buildCreateOntologyRequest(
  params: CreateOntologyParams = {},
): CreateOntologyRequest {
  return {
    id: params.id ?? crypto.randomUUID(),
    name: params.name ?? 'Новая онтология',
    data: toOntologyDocument(params.document ?? createEmptyDocument()),
  };
}

/**
 * Builds an `UpdateOntologyRequest` payload from page domain values.
 */
export function buildUpdateOntologyRequest(params: UpdateOntologyParams): UpdateOntologyRequest {
  const request: UpdateOntologyRequest = {};

  if (params.name !== undefined) {
    request.name = params.name;
  }
  if (params.document !== undefined) {
    request.data = toOntologyDocument(params.document);
  }

  return request;
}

/**
 * Returns a copy of `document` with updated ontology contexts.
 */
export function applyOntologyContexts(
  document: OntologyDocument,
  contexts: OntologyContext[],
): OntologyDocument {
  return {
    ...document,
    contexts,
  };
}

/**
 * Page-level adapter over {@link OntologyService} that prepares request DTOs
 * and converts responses into structures consumed by `OntologyPage`.
 */
export class OntologyPageApi {
  constructor(private readonly service: OntologyService = ontologyService) {}

  async loadList(): Promise<OntologyListItem[]> {
    const response = await this.service.findAll();
    return response.items.map(toOntologyListItem);
  }

  async loadById(id: string): Promise<LoadedOntology> {
    const response = await this.service.find(id);
    return toLoadedOntology(response);
  }

  async create(params?: CreateOntologyParams): Promise<LoadedOntology> {
    const request = buildCreateOntologyRequest(params);
    const response = await this.service.create(request);
    return toLoadedOntology(response);
  }

  async updateDocument(id: string, document: OntologyDocument): Promise<LoadedOntology> {
    const request = buildUpdateOntologyRequest({ document });
    const response = await this.service.update(id, request);
    return toLoadedOntology(response);
  }

  async updateConfiguration(
    id: string,
    name: string,
    document: OntologyDocument,
    contexts: OntologyContext[],
  ): Promise<LoadedOntology> {
    const nextDocument = applyOntologyContexts(document, contexts);
    const request = buildUpdateOntologyRequest({ name, document: nextDocument });
    const response = await this.service.update(id, request);
    return toLoadedOntology(response);
  }

  async remove(id: string): Promise<void> {
    await this.service.delete(id);
  }
}

export const ontologyPageApi = new OntologyPageApi();
