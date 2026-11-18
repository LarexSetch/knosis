export interface CreateKnowledgeResponse {
  id: string;
  name: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetKnowledgeResponse {
  id: string;
  name: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeSummaryItem {
  id: string;
  name: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListKnowledgeResponse {
  items: KnowledgeSummaryItem[];
  total: number;
}

export interface UpdateKnowledgeResponse {
  id: string;
  name: string;
  summary: string;
  createdAt: string;
  updatedAt: string;
}
