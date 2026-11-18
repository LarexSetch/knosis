import type { KnowlageGraph, Node, Relation, Context } from './graph.dto';

export interface CreateKnowledgeRequest {
  id?: string;
  name: string;
  summary: string;
  nodes: Node[];
  relations: Relation[];
  contexts: Context[];
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
}

export interface DeleteKnowledgeRequest {
  id: string;
}
