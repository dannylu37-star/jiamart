import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('sp_users')
export class User {
  @PrimaryGeneratedColumn() id: number;
  @Column({ nullable: true }) username: string;
  @Column({ nullable: true }) password: string;
  @Column({ nullable: true }) mobile: string;
  @Column({ nullable: true }) email: string;
  @Column({ name: 'first_name', nullable: true }) firstName: string;
  @Column({ name: 'last_name', nullable: true }) lastName: string;
  @Column({ nullable: true }) address: string;
  @Column({ name: 'post_code', nullable: true }) postCode: string;
  @Column({ name: 'vip_level', default: 0 }) vipLevel: number;
  @Column({ default: true }) status: boolean;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
