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
import { OntologyEntity } from '../../ontology/ontology.entity';
import { KnowledgeEntity } from '../knowledge.entity';

@Entity('knowledge_import')
export class KnowledgeImportEntity {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id!: string;

  @Index('idx_knowledge_import_name')
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', default: '', comment: 'text/plaint document body' })
  document!: string;

  @Column({ type: 'varchar', length: 100, default: '0' })
  status!: ImportStatus;

  @ManyToOne(() => OntologyEntity, { nullable: false })
  @JoinColumn({ name: 'ontology_id' })
  ontology!: OntologyEntity;

  @ManyToOne(() => KnowledgeEntity, { nullable: false })
  @JoinColumn({ name: 'knowledge_id' })
  knowledge!: KnowledgeEntity;

  @CreateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  updated_at!: Date;
}

export enum ImportStatus {
  PROCESSING,
  DONE,
}
