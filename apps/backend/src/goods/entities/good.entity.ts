import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('sp_goods')
export class Good {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'hide_code', nullable: true }) hideCode: string;
  @Column({ nullable: true }) name: string;
  @Column({ name: 'en_name', nullable: true }) enName: string;
  @Column({ name: 'type_id', nullable: true }) typeId: number;
  @Column({ name: 'sell_price', type: 'numeric', nullable: true }) sellPrice: number;
  @Column({ name: 'original_price', type: 'numeric', nullable: true }) originalPrice: number;
  @Column({ name: 'cost_price', type: 'numeric', nullable: true }) costPrice: number;
  @Column({ nullable: true }) picurl: string;
  @Column({ default: 0 }) sales: number;
  @Column({ default: true }) status: boolean;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
