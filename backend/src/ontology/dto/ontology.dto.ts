export interface Document {
  elements: Element[];
  relations: Relation[];
  contexts: Context[];
}

export interface Element {
  id: string; // system label of the element (unique ID)
  name: string;
  summary: string;
  meta: ElementMeta;
  associations: Association[];
}

export interface ElementMeta {
  color: string;
  position: {
    x: number;
    y: number;
  };
}

export interface Relation {
  id: string; // system label of the relation (unique ID)
  name: string;
  summary: string;
  sourceElementId: string;
  targetElementId: string;
}

export interface Association {
  id: string; // system label of the association (unique ID)
  name: string;
  summary: string;
  elementIds: string[];
  elementsAll: boolean;
}

export interface Context {
    id: string; // system label of the context (unique ID)
    name: string;
    summary: string;
}
