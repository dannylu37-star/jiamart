import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ops_store')
export class StoreEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column() name: string;
  @Column({ nullable: true, type: 'text' }) address: string;
  @Column({ nullable: true }) mobile: string;
  @Column({ name: 'manager_id', nullable: true }) managerId: number;
  @Column({ name: 'deputy_id', nullable: true }) deputyId: number;
  @Column({ default: true }) status: boolean;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
