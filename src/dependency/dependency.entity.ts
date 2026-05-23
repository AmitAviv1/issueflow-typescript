import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Ticket } from '../ticket/ticket.entity';

@Entity()
export class Dependency {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ticketId: number;

  @ManyToOne(() => Ticket)
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket;

  @Column()
  blockedById: number;

  @ManyToOne(() => Ticket)
  @JoinColumn({ name: 'blockedById' })
  blockedBy: Ticket;
}
