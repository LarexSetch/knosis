import { OntologyEntity } from '../ontology/ontology.entity';
import { Context, KnowlageGraph, Node } from './dto/graph.dto';
import { KnowledgeEntity } from './knowledge.entity';

export interface GraphService {
    createNode(node: Node): Promise<void>;
    deleteNode(node: Node): Promise<void>;
    relate(source: Node, target: Node): Promise<void>;
    contextualize(context: Context, nodes: Node[]): Promise<void>;
    document(): Promise<KnowlageGraph>;
}

export class GraphServiceImpl implements GraphService {
    constructor(private readonly graph: KnowledgeEntity, private readonly repository: OntologyEntity) { }

    createNode(node: Node): Promise<void> {
        throw new Error('Method not implemented.');
    }

    deleteNode(node: Node): Promise<void> {
        throw new Error('Method not implemented.');
    }

    relate(source: Node, target: Node): Promise<void> {
        throw new Error('Method not implemented.');
    }

    contextualize(context: Context, nodes: Node[]): Promise<void> {
        throw new Error('Method not implemented.');
    }
    document(): Promise<KnowlageGraph> {
        throw new Error('Method not implemented.');
    }
}