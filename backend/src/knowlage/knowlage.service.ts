import type {
  Context,
  ContextNodeRelation,
  KnowledgeGraph,
  Node,
  Relation,
} from './dto/graph.dto';

export const GRAPH_SERVICE_TOKEN = 'GraphService';

export interface GraphService {
  save(graph: KnowledgeGraph): Promise<void>;
  load(id: string): Promise<KnowledgeGraph>;
}

interface GraphElemenetModifyer {
  createNode(node: Node): Promise<void>;
  deleteNode(node: Node): Promise<void>;
  relate(relation: Relation): Promise<void>;
  contextualize(context: Context, relations: ContextNodeRelation[]): Promise<void>;
  findNodes(): Promise<Node[]>;
  findRelations(): Promise<Relation[]>;
  findContexts(): Promise<Context[]>;
  findContextRelations(): Promise<ContextNodeRelation[]>;
}
