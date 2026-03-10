import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { GoodsEntity } from './goods.entity';

@Entity('sp_stock')
export class StockEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'goods_id' }) goodsId: number;
  @Column({ default: 0 }) num: number;
  @Column({ name: 'old_num', default: 0 }) oldNum: number;
  @Column({ nullable: true }) reason: string;
  @ManyToOne(() => GoodsEntity) @JoinColumn({ name: 'goods_id' }) goods: GoodsEntity;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
