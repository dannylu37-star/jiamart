import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('sp_admins')
export class Admin {
  @PrimaryGeneratedColumn() id: number;
  @Column({ unique: true }) username: string;
  @Column() password: string;
  @Column({ default: 0 }) authority: number;
  @Column({ name: 'update_auth', nullable: true }) updateAuth: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
