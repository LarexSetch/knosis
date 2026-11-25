import type {
  CreateOntologyRequest,
  DeleteOntologyRequest,
  GetOntologyRequest,
  UpdateOntologyRequest,
} from '../../../backend/src/ontology/dto/requests.dto';
import type {
  CreateOntologyResponse,
  GetOntologyResponse,
  ListOntologiesResponse,
  UpdateOntologyResponse,
} from '../../../backend/src/ontology/dto/responses.dto';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

async function send(path: string, init?: RequestInit): Promise<Response> {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, init);

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `API request failed (${response.status} ${response.statusText})${details ? `: ${details}` : ''}`,
    );
  }

  return response;
}

async function getJson<TResponse>(path: string): Promise<TResponse> {
  const response = await send(path);
  return await response.json() as TResponse;
}

async function sendJson<TResponse>(
  path: string,
  method: 'POST' | 'PUT',
  body: CreateOntologyRequest | UpdateOntologyRequest,
): Promise<TResponse> {
  const response = await send(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return await response.json() as TResponse;
}

export const ontologyService = {
  create(request: CreateOntologyRequest): Promise<CreateOntologyResponse> {
    return sendJson<CreateOntologyResponse>('/ontology', 'POST', request);
  },

  list(): Promise<ListOntologiesResponse> {
    return getJson<ListOntologiesResponse>('/ontology');
  },

  get(request: GetOntologyRequest): Promise<GetOntologyResponse> {
    return getJson<GetOntologyResponse>(`/ontology/${encodeURIComponent(request.id)}`);
  },

  update(
    params: GetOntologyRequest,
    request: UpdateOntologyRequest,
  ): Promise<UpdateOntologyResponse> {
    return sendJson<UpdateOntologyResponse>(`/ontology/${encodeURIComponent(params.id)}`, 'PUT', request);
  },

  async delete(request: DeleteOntologyRequest): Promise<void> {
    await send(`/ontology/${encodeURIComponent(request.id)}`, { method: 'DELETE' });
  },
};
