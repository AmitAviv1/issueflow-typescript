import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  action: string;

  @Column()
  entityType: string;

  @Column()
  entityId: number;

  @Column()
  performedBy: number;

  @Column({ default: 'USER' })
  actor: string;

  @CreateDateColumn()
  timestamp: Date;
}
