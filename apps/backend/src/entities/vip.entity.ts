import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('sp_vip')
export class VipEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ nullable: true }) name: string;
  @Column({ name: 'name_en', nullable: true }) nameEn: string;
  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true }) discount: number;
  @Column({ nullable: true }) days: number;
  @Column({ default: true }) status: boolean;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
