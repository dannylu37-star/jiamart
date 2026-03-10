import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { UserEntity } from './user.entity';
import { OrderDetailEntity } from './order-detail.entity';

@Entity('sp_order')
export class OrderEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'order_num', nullable: true, unique: true }) orderNum: string;
  @Column({ nullable: true }) uid: number;
  @Column({ name: 'first_name', nullable: true }) firstName: string;
  @Column({ name: 'last_name', nullable: true }) lastName: string;
  @Column({ nullable: true, type: 'text' }) address1: string;
  @Column({ nullable: true, type: 'text' }) address2: string;
  @Column({ nullable: true }) city: string;
  @Column({ nullable: true }) country: string;
  @Column({ name: 'post_code', nullable: true }) postCode: string;
  @Column({ nullable: true }) mobile: string;
  @Column({ name: 'post_money', type: 'numeric', precision: 10, scale: 2, default: 0 }) postMoney: number;
  @Column({ name: 'post_method', nullable: true }) postMethod: string;
  @Column({ nullable: true }) coupon: string;
  @Column({ name: 'order_price', type: 'numeric', precision: 10, scale: 2, nullable: true }) orderPrice: number;
  @Column({ name: 'need_pay_money', type: 'numeric', precision: 10, scale: 2, nullable: true }) needPayMoney: number;
  @Column({ name: 'coupons_money', type: 'numeric', precision: 10, scale: 2, default: 0 }) couponsMoney: number;
  @Column({ name: 'now_money', type: 'numeric', precision: 10, scale: 2, nullable: true }) nowMoney: number;
  @Column({ nullable: true, type: 'text' }) beizhu: string;
  @Column({ name: 'pay_method', nullable: true }) payMethod: string;
  @Column({ nullable: true }) status: string;
  @Column({ name: 'checkout_session_id', nullable: true }) checkoutSessionId: string;
  @Column({ name: 'paid_amount', type: 'numeric', precision: 10, scale: 2, nullable: true }) paidAmount: number;
  @Column({ name: 'paid_currency', nullable: true }) paidCurrency: string;
  @Column({ name: 'payment_status', nullable: true }) paymentStatus: string;
  @ManyToOne(() => UserEntity) @JoinColumn({ name: 'uid' }) user: UserEntity;
  @OneToMany(() => OrderDetailEntity, d => d.order) details: OrderDetailEntity[];
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
