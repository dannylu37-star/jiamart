import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('sp_order')
export class Order {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'order_num', nullable: true }) orderNum: string;
  @Column({ nullable: true }) uid: number;
  @Column({ name: 'need_pay_money', type: 'numeric', nullable: true }) needPayMoney: number;
  @Column({ name: 'payment_status', nullable: true }) paymentStatus: string;
  @Column({ nullable: true }) status: string;
  @Column({ name: 'pay_method', nullable: true }) payMethod: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
