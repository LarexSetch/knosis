import type { Context, KnowlageGraph, Node, Relation } from './graph.dto';

export interface CreateKnowledgeRequest {
  id?: string;
  name: string;
  summary: string;
  nodes?: Node[];
  relations?: Relation[];
  contexts?: Context[];
  graph?: KnowlageGraph;
  document?: KnowlageGraph;
}

export interface GetKnowledgeRequest {
  id: string;
}

export interface UpdateKnowledgeRequest {
  name?: string;
  summary?: string;
  nodes?: Node[];
  relations?: Relation[];
  contexts?: Context[];
  graph?: KnowlageGraph;
  document?: KnowlageGraph;
}

export interface DeleteKnowledgeRequest {
  id: string;
}
