import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CategoryEntity } from './category.entity';

@Entity('sp_goods')
export class GoodsEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'hide_code', nullable: true }) hideCode: string;
  @Column({ nullable: true }) name: string;
  @Column({ name: 'en_name', nullable: true }) enName: string;
  @Column({ nullable: true, type: 'text' }) subtitle: string;
  @Column({ name: 'en_subtitle', nullable: true, type: 'text' }) enSubtitle: string;
  @Column({ nullable: true, type: 'text' }) content: string;
  @Column({ name: 'type_id', nullable: true }) typeId: number;
  @Column({ name: 'type_parent_id', nullable: true }) typeParentId: number;
  @Column({ nullable: true }) attr: string;
  @Column({ name: 'sell_price', type: 'numeric', precision: 10, scale: 2, nullable: true }) sellPrice: number;
  @Column({ name: 'original_price', type: 'numeric', precision: 10, scale: 2, nullable: true }) originalPrice: number;
  @Column({ name: 'cost_price', type: 'numeric', precision: 10, scale: 2, nullable: true }) costPrice: number;
  @Column({ nullable: true, type: 'text' }) picurl: string;
  @Column({ default: 0 }) sales: number;
  @Column({ name: 'fake_sales', default: 0 }) fakeSales: number;
  @Column({ name: 'labels_id', nullable: true }) labelsId: number;
  @Column({ default: true }) status: boolean;
  @ManyToOne(() => CategoryEntity) @JoinColumn({ name: 'type_id' }) category: CategoryEntity;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
