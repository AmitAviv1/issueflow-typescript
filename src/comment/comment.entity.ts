import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, ManyToMany, JoinTable, VersionColumn, CreateDateColumn } from 'typeorm';
import { Ticket } from '../ticket/ticket.entity';
import { User } from '../user/user.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ticketId: number;

  @ManyToOne(() => Ticket)
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket;

  @Column()
  authorId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  content: string;

  @ManyToMany(() => User)
  @JoinTable()
  mentionedUsers: User[];

  @CreateDateColumn()
  createdAt: Date;

  @VersionColumn()
  version: number;
}
