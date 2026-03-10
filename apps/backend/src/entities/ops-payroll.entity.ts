import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { OpsStaffEntity } from './ops-staff.entity';

@Entity('ops_payroll')
export class OpsPayrollEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'staff_id' }) staffId: number;
  @Column({ name: 'period_start', type: 'date' }) periodStart: string;
  @Column({ name: 'period_end', type: 'date' }) periodEnd: string;
  @Column({ name: 'base_salary', type: 'numeric', precision: 10, scale: 2, nullable: true }) baseSalary: number;
  @Column({ name: 'hours_worked', type: 'numeric', precision: 8, scale: 2, default: 0 }) hoursWorked: number;
  @Column({ name: 'overtime_hours', type: 'numeric', precision: 8, scale: 2, default: 0 }) overtimeHours: number;
  @Column({ name: 'overtime_pay', type: 'numeric', precision: 10, scale: 2, default: 0 }) overtimePay: number;
  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 }) bonus: number;
  @Column({ type: 'numeric', precision: 10, scale: 2, default: 0 }) deduction: number;
  @Column({ name: 'deduction_note', nullable: true }) deductionNote: string;
  @Column({ type: 'numeric', precision: 10, scale: 2, nullable: true }) total: number;
  @Column({ default: 'pending' }) status: string;
  @Column({ name: 'paid_at', nullable: true, type: 'datetime' }) paidAt: Date;
  @ManyToOne(() => OpsStaffEntity) @JoinColumn({ name: 'staff_id' }) staff: OpsStaffEntity;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
