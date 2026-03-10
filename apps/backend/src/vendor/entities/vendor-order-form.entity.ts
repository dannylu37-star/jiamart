import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Vendor } from './vendor.entity';

export type FormStatus = 'pending' | 'parsed' | 'reviewed' | 'error';

@Entity('vendor_order_forms')
export class VendorOrderForm {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  vendor_id: number;

  @ManyToOne(() => Vendor, v => v.forms)
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column({ length: 300 })
  original_filename: string;

  @Column({ length: 500 })
  storage_path: string;

  @Column({ type: 'enum', enum: ['pending', 'parsed', 'reviewed', 'error'], default: 'pending' })
  status: FormStatus;

  @Column({ type: 'json', nullable: true })
  parsed_data: Array<{ product_name: string; unit: string; unit_price: number; shelf_life_days?: number; lead_time_days?: number }>;

  @Column({ type: 'text', nullable: true })
  review_notes: string;

  @CreateDateColumn()
  uploaded_at: Date;

  @Column({ nullable: true })
  reviewed_at: Date;
}
