import type { Document } from './ontology.dto';

export interface CreateOntologyRequest {
  id?: string;
  name: string;
  data: Document;
}

export interface GetOntologyRequest {
  id: string;
}

export interface UpdateOntologyRequest {
  name?: string;
  data?: Document;
}

export interface DeleteOntologyRequest {
  id: string;
}
