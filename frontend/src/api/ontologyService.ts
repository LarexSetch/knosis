import type {
  CreateOntologyRequest,
  UpdateOntologyRequest,
} from '../../../backend/src/ontology/dto/requests.dto';
import type {
  CreateOntologyResponse,
  GetOntologyResponse,
  ListOntologiesResponse,
  UpdateOntologyResponse,
} from '../../../backend/src/ontology/dto/responses.dto';

/**
 * Client contract mirroring the endpoints of `OntologyController`.
 */
export interface OntologyService {
  create(request: CreateOntologyRequest): Promise<CreateOntologyResponse>;
  findAll(): Promise<ListOntologiesResponse>;
  find(id: string): Promise<GetOntologyResponse>;
  update(id: string, request: UpdateOntologyRequest): Promise<UpdateOntologyResponse>;
  delete(id: string): Promise<void>;
}

const DEFAULT_API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(
  /\/+$/,
  '',
);

/**
 * HTTP implementation of {@link OntologyService} using the Fetch API.
 */
export class HttpOntologyService implements OntologyService {
  private readonly resourceUrl: string;

  constructor(baseUrl: string = DEFAULT_API_BASE_URL) {
    this.resourceUrl = `${baseUrl.replace(/\/+$/, '')}/ontology`;
  }

  create(request: CreateOntologyRequest): Promise<CreateOntologyResponse> {
    return this.requestJson<CreateOntologyResponse>('', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }

  findAll(): Promise<ListOntologiesResponse> {
    return this.requestJson<ListOntologiesResponse>('', {
      method: 'GET',
    });
  }

  find(id: string): Promise<GetOntologyResponse> {
    return this.requestJson<GetOntologyResponse>(`/${encodeURIComponent(id)}`, {
      method: 'GET',
    });
  }

  update(id: string, request: UpdateOntologyRequest): Promise<UpdateOntologyResponse> {
    return this.requestJson<UpdateOntologyResponse>(`/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  }

  async delete(id: string): Promise<void> {
    await this.send(`/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  private async requestJson<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
    const response = await this.send(path, init);
    return (await response.json()) as TResponse;
  }

  private async send(path: string, init?: RequestInit): Promise<Response> {
    const response = await fetch(`${this.resourceUrl}${path}`, init);

    if (!response.ok) {
      const details = await response.text();
      throw new Error(
        `API request failed (${response.status} ${response.statusText})${details ? `: ${details}` : ''}`,
      );
    }

    return response;
  }
}

export const ontologyService: OntologyService = new HttpOntologyService();
