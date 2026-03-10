import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { OpsStaffEntity } from './ops-staff.entity';

@Entity('ops_attendance')
export class OpsAttendanceEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'staff_id' }) staffId: number;
  @Column({ name: 'shift_id', nullable: true }) shiftId: number;
  @Column({ name: 'clock_in', nullable: true, type: 'datetime' }) clockIn: Date;
  @Column({ name: 'clock_out', nullable: true, type: 'datetime' }) clockOut: Date;
  @Column({ name: 'clock_in_lat', type: 'numeric', precision: 10, scale: 6, nullable: true }) clockInLat: number;
  @Column({ name: 'clock_in_lng', type: 'numeric', precision: 10, scale: 6, nullable: true }) clockInLng: number;
  @Column({ name: 'photo_url', nullable: true }) photoUrl: string;
  @Column({ default: 'normal' }) status: string;
  @Column({ name: 'worked_minutes', nullable: true }) workedMinutes: number;
  @ManyToOne(() => OpsStaffEntity) @JoinColumn({ name: 'staff_id' }) staff: OpsStaffEntity;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
