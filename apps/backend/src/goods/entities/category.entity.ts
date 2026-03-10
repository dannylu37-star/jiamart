import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('sp_categories')
export class Category {
  @PrimaryGeneratedColumn() id: number;
  @Column({ nullable: true }) name: string;
  @Column({ name: 'en_name', nullable: true }) enName: string;
  @Column({ nullable: true }) pid: number;
  @Column({ default: true }) status: boolean;
}
