import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('sp_stock')
export class Stock {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'goods_id' }) goodsId: number;
  @Column({ default: 0 }) num: number;
  @Column({ name: 'old_num', default: 0 }) oldNum: number;
  @Column({ nullable: true }) reason: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
