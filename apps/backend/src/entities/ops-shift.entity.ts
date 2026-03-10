import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { OpsStaffEntity } from './ops-staff.entity';

@Entity('ops_shift')
export class OpsShiftEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'staff_id' }) staffId: number;
  @Column({ name: 'store_id', nullable: true }) storeId: number;
  @Column({ name: 'shift_date', type: 'date' }) shiftDate: string;
  @Column({ name: 'start_time', type: 'time' }) startTime: string;
  @Column({ name: 'end_time', type: 'time' }) endTime: string;
  @Column({ name: 'shift_type', default: 'normal' }) shiftType: string;
  @Column({ default: 'scheduled' }) status: string;
  @Column({ nullable: true, type: 'text' }) notes: string;
  @ManyToOne(() => OpsStaffEntity) @JoinColumn({ name: 'staff_id' }) staff: OpsStaffEntity;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
