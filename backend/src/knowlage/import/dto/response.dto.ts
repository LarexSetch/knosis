import type { ImportStatus } from '../import.entity';

export interface KnowledgeImportRelation {
  id: string;
  name: string;
}

export interface CreateKnowledgeImportResponse {
  id: string;
  name: string;
  document: string;
  status: ImportStatus;
  ontology: KnowledgeImportRelation;
  knowledge: KnowledgeImportRelation;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeImportSummaryItem {
  id: string;
  name: string;
  status: ImportStatus;
  ontology: KnowledgeImportRelation;
  knowledge: KnowledgeImportRelation;
  createdAt: string;
  updatedAt: string;
}

export interface ListKnowledgeImportsResponse {
  items: KnowledgeImportSummaryItem[];
  total: number;
}
