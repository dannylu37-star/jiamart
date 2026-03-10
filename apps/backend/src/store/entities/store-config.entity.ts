import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('sp_store_config')
export class StoreConfig {
  @PrimaryGeneratedColumn() id: number;
  @Column({ unique: true }) key: string;
  @Column({ nullable: true }) value: string;
  @Column({ nullable: true }) description: string;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
