import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('sp_categories')
export class CategoryEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ nullable: true }) name: string;
  @Column({ name: 'en_name', nullable: true }) enName: string;
  @Column({ nullable: true, type: 'text' }) description: string;
  @Column({ name: 'en_description', nullable: true, type: 'text' }) enDescription: string;
  @Column({ nullable: true }) pid: number;
  @Column({ nullable: true }) checkinfo: string;
  @Column({ nullable: true }) picurl: string;
  @Column({ nullable: true }) age: string;
  @Column({ default: 0 }) sort: number;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
