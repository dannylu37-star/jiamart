import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('sp_staff')
export class StaffEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ nullable: true }) position: string;
  @Column({ nullable: true }) name: string;
  @Column({ nullable: true }) mobile: string;
  @Column({ name: 'start_time', nullable: true }) startTime: string;
  @Column({ name: 'end_time', nullable: true }) endTime: string;
  @Column({ nullable: true }) address: string;
  @Column({ default: true }) status: boolean;
  @Column({ name: 'staff_code', nullable: true, unique: true }) staffCode: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
