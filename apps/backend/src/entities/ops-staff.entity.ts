import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('ops_staff')
export class OpsStaffEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'staff_code', nullable: true, unique: true }) staffCode: string;
  @Column() name: string;
  @Column({ nullable: true }) mobile: string;
  @Column({ nullable: true }) email: string;
  @Column({ name: 'id_card', nullable: true }) idCard: string;
  @Column({ nullable: true }) position: string;
  @Column({ nullable: true }) department: string;
  @Column({ name: 'hire_date', nullable: true, type: 'date' }) hireDate: string;
  @Column({ name: 'contract_end', nullable: true, type: 'date' }) contractEnd: string;
  @Column({ name: 'salary_base', type: 'numeric', precision: 10, scale: 2, nullable: true }) salaryBase: number;
  @Column({ name: 'bank_account', nullable: true }) bankAccount: string;
  @Column({ name: 'store_id', nullable: true }) storeId: number;
  @Column({ default: 'staff' }) role: string; // staff | manager | admin
  @Column({ default: 'active' }) status: string;
  @Column({ nullable: true, type: 'text' }) notes: string;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
