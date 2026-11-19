import type { Context, ContextNodeRelation, KnowledgeGraph, Node, Relation } from './graph.dto';

export interface CreateKnowledgeRequest {
  name: string;
  summary: string;
  nodes: Node[];
  relations: Relation[];
  contexts: Context[];
  contextRelations: ContextNodeRelation[];
}

export interface GetKnowledgeRequest {
  id: string;
}

export interface UpdateKnowledgeRequest {
  name: string;
  summary: string;
  nodes: Node[];
  relations: Relation[];
  contexts: Context[];
  contextRelations: ContextNodeRelation[];
}

export interface DeleteKnowledgeRequest {
  id: string;
}
