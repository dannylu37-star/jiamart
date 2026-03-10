import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { Vendor } from './vendor.entity';

@Entity('vendor_products')
export class VendorProduct {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  vendor_id: number;

  @ManyToOne(() => Vendor, v => v.products)
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column({ length: 200 })
  product_name: string;

  @Column({ nullable: true })
  sku_code: string;

  @Column({ length: 50 })
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unit_price: number;

  @Column({ default: 'GBP' })
  currency: string;

  @Column({ nullable: true })
  shelf_life_days: number;

  @Column({ nullable: true })
  lead_time_days: number;

  @Column({ default: true })
  is_active: boolean;

  @UpdateDateColumn()
  last_updated: Date;
}
