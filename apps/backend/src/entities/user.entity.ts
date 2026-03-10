import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { VipEntity } from './vip.entity';

@Entity('sp_users')
export class UserEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ nullable: true }) username: string;
  @Column({ nullable: true, select: false }) password: string;
  @Column({ nullable: true }) mobile: string;
  @Column({ nullable: true }) email: string;
  @Column({ name: 'first_name', nullable: true }) firstName: string;
  @Column({ name: 'last_name', nullable: true }) lastName: string;
  @Column({ nullable: true }) address: string;
  @Column({ name: 'post_code', nullable: true }) postCode: string;
  @Column({ nullable: true, default: 'employee' }) role: string;
  @Column({ name: 'store_id', nullable: true }) storeId: number;
  @Column({ name: 'vip_level', default: 0 }) vipLevel: number;
  @Column({ default: true }) status: boolean;
  @Column({ name: 'wx_avatar_url', nullable: true }) wxAvatarUrl: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
