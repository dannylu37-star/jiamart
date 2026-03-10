import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('sp_order_details')
export class OrderDetail {
  @PrimaryGeneratedColumn() id: number;
  @Column() oid: number;
  @Column({ nullable: true }) gid: number;
  @Column({ nullable: true }) name: string;
  @Column({ default: 1 }) num: number;
  @Column({ type: 'numeric', nullable: true }) price: number;
}
