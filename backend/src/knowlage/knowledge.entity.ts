import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { OntologyEntity } from '../ontology/ontology.entity';

/**
 * TypeORM entity representing a row in the `knowledge` table.
 */
@Entity('knowledge')
export class KnowledgeEntity {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id!: string;

  @Index('idx_knowledge_name')
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', default: '' })
  summary!: string;

  @ManyToOne(() => OntologyEntity, { nullable: true })
  @JoinColumn({ name: 'ontology_id' })
  ontology?: OntologyEntity | null;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;
}

export { KnowledgeEntity as Knowledge };
