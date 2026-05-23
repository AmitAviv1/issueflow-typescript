import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  // select: false → never returned by queries unless explicitly selected.
  @Column({ nullable: true, select: false })
  password: string;

  @Column({ unique: true })
  email: string;

  @Column()
  fullName: string;

  @Column({ default: 'DEVELOPER' })
  role: string;
}