import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('sku_config')
export class SkuConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  store_id: number;

  @Column({ nullable: true })
  sku_code: string;

  @Column({ nullable: true })
  product_name: string;

  @Column({ default: 3 })
  lead_time_days: number;

  @Column({ default: 2 })
  safety_stock_days: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  avg_daily_usage: number;
}
