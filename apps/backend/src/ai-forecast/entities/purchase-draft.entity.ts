import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('purchase_order_drafts')
export class PurchaseDraft {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  forecast_run_id: number;

  @Column()
  store_id: number;

  @Column({ length: 200 })
  product_name: string;

  @Column({ nullable: true })
  sku_code: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  suggested_qty: number;

  @Column({ nullable: true })
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  current_stock: number;

  @Column({ nullable: true })
  lead_time_days: number;

  @Column({ type: 'enum', enum: ['suggested', 'confirmed', 'rejected'], default: 'suggested' })
  status: 'suggested' | 'confirmed' | 'rejected';

  @CreateDateColumn()
  created_at: Date;
}
