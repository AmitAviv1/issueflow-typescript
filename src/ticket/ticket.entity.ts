import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, VersionColumn } from 'typeorm';
import { User } from '../user/user.entity';
import { Project } from '../project/project.entity';

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 'TODO' })
  status: string;

  @Column({ default: 'MEDIUM' })
  priority: string;

  @Column()
  type: string;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column()
  projectId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigneeId' })
  assignee: User;

  @Column({ nullable: true })
  assigneeId: number;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ default: false })
  isOverdue: boolean;

  @Column({ nullable: true })
  deletedAt: Date;

  @VersionColumn()
  version: number;
}
