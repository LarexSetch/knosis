import type { Document } from './dto/ontology.dto';

/**
 * Internal entity representing a row in the `ontology` table.
 * Not exposed directly to external API callers.
 */
export interface OntologyEntity {
  id: string;
  name: string;
  data: Document;
  created_at: Date | string;
  updated_at: Date | string;
}
