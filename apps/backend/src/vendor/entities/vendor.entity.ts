import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { VendorProduct } from './vendor-product.entity';
import { VendorOrderForm } from './vendor-order-form.entity';

@Entity('vendors')
export class Vendor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  name: string;

  @Column({ nullable: true })
  contact_name: string;

  @Column({ nullable: true })
  contact_email: string;

  @Column({ nullable: true })
  contact_phone: string;

  @Column({ nullable: true })
  payment_terms: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => VendorProduct, p => p.vendor)
  products: VendorProduct[];

  @OneToMany(() => VendorOrderForm, f => f.vendor)
  forms: VendorOrderForm[];
}
