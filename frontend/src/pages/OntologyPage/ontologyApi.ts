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
import type {
  OntologyContext,
  OntologyDocument,
  OntologyElement,
  OntologyListItem,
  OntologyRelation,
} from './types';

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
 * Builds a new graph vertex (`OntologyElement`) with a non-overlapping default position.
 */
export function buildNewOntologyElement(existingElements: OntologyElement[]): OntologyElement {
  const offset = (existingElements.length % 6) * 40;
  return {
    id: crypto.randomUUID(),
    name: 'Новый элемент',
    summary: '',
    meta: {
      color: '#525252',
      position: { x: 80 + offset, y: 80 + offset },
    },
    associations: [],
  };
}

/**
 * Builds a new graph relation (`OntologyRelation`) connecting two elements.
 */
export function buildNewOntologyRelation(
  sourceElementId: string,
  targetElementId: string,
): OntologyRelation {
  return {
    id: crypto.randomUUID(),
    name: 'Новая связь',
    summary: '',
    sourceElementId,
    targetElementId,
  };
}

/**
 * Applies an updated vertex or relation to the document, cascading vertex label renames
 * across relations and element associations.
 */
export function applyElementUpdate(
  document: OntologyDocument,
  item: OntologyElement | OntologyRelation,
  previousId: string,
): OntologyDocument {
  if (!('meta' in item)) {
    return {
      ...document,
      relations: document.relations.map((relation) => (relation.id === previousId ? item : relation)),
    };
  }

  const renamed = item.id !== previousId;
  const elements = document.elements.map((element) => {
    const nextElement = element.id === previousId ? item : element;
    if (!renamed) {
      return nextElement;
    }

    return {
      ...nextElement,
      associations: nextElement.associations.map((association) => ({
        ...association,
        elementIds: association.elementIds.map((id) => (id === previousId ? item.id : id)),
      })),
    };
  });

  const relations = renamed
    ? document.relations.map((relation) => ({
        ...relation,
        sourceElementId: relation.sourceElementId === previousId ? item.id : relation.sourceElementId,
        targetElementId: relation.targetElementId === previousId ? item.id : relation.targetElementId,
      }))
    : document.relations;

  return {
    ...document,
    elements,
    relations,
  };
}

/**
 * Removes a vertex from the document along with any relations and association references pointing to it.
 */
export function removeElement(document: OntologyDocument, elementId: string): OntologyDocument {
  return {
    ...document,
    elements: document.elements
      .filter((element) => element.id !== elementId)
      .map((element) => ({
        ...element,
        associations: element.associations.map((association) => ({
          ...association,
          elementIds: association.elementIds.filter((id) => id !== elementId),
        })),
      })),
    relations: document.relations.filter(
      (relation) => relation.sourceElementId !== elementId && relation.targetElementId !== elementId,
    ),
  };
}

/**
 * Updates `sourceElementId` and `targetElementId` for a reconnected relation.
 */
export function reconnectRelation(
  document: OntologyDocument,
  relationId: string,
  sourceElementId: string,
  targetElementId: string,
): OntologyDocument {
  return {
    ...document,
    relations: document.relations.map((relation) => (relation.id === relationId
      ? { ...relation, sourceElementId, targetElementId }
      : relation)),
  };
}

/**
 * Removes a relation (`OntologyRelation`) from the document by ID.
 */
export function removeRelation(document: OntologyDocument, relationId: string): OntologyDocument {
  return {
    ...document,
    relations: document.relations.filter((relation) => relation.id !== relationId),
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
