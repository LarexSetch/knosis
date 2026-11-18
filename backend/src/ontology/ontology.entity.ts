import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import type { Document } from './dto/ontology.dto';

/**
 * TypeORM entity representing a row in the `ontology` table.
 * Not exposed directly to external API callers.
 */
@Entity('ontology')
export class OntologyEntity {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id!: string;

  @Index('idx_ontology_name')
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'jsonb' })
  data!: Document;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;
}
