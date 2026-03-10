import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { OrderEntity } from './order.entity';
import { GoodsEntity } from './goods.entity';

@Entity('sp_order_details')
export class OrderDetailEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column() oid: number;
  @Column({ nullable: true }) gid: number;
  @Column({ nullable: true }) name: string;
  @Column({ default: 1 }) num: number;
  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true }) price: number;
  @ManyToOne(() => OrderEntity, o => o.details) @JoinColumn({ name: 'oid' }) order: OrderEntity;
  @ManyToOne(() => GoodsEntity) @JoinColumn({ name: 'gid' }) goods: GoodsEntity;
}
