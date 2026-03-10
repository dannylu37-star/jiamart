import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('ops_schedule_draft')
export class ScheduleDraft {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  forecast_run_id: number;

  @Column()
  store_id: number;

  @Column()
  staff_id: number;

  @Column({ type: 'date' })
  shift_date: string;

  @Column({ type: 'time' })
  shift_start: string;

  @Column({ type: 'time' })
  shift_end: string;

  @Column({ nullable: true })
  role: string;

  @Column({ type: 'enum', enum: ['suggested', 'confirmed', 'rejected'], default: 'suggested' })
  status: 'suggested' | 'confirmed' | 'rejected';

  @CreateDateColumn()
  created_at: Date;
}
