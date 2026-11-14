import type { Document } from './ontology.dto';

export interface CreateOntologyResponse {
  id: string;
  name: string;
  data: Document;
  createdAt: string;
  updatedAt: string;
}

export interface GetOntologyResponse {
  id: string;
  name: string;
  data: Document;
  createdAt: string;
  updatedAt: string;
}

export interface OntologySummaryItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListOntologiesResponse {
  items: OntologySummaryItem[];
  total: number;
}

export interface UpdateOntologyResponse {
  id: string;
  name: string;
  data: Document;
  createdAt: string;
  updatedAt: string;
}
