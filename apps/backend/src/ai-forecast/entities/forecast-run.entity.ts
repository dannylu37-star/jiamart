import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type ForecastType = 'staffing' | 'sales_7d' | 'sales_30d' | 'inventory';
export type ForecastStatus = 'pending' | 'done' | 'error';

@Entity('ai_forecast_runs')
export class ForecastRun {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  store_id: number;

  @Column({ type: 'enum', enum: ['staffing', 'sales_7d', 'sales_30d', 'inventory'] })
  forecast_type: ForecastType;

  @CreateDateColumn()
  generated_at: Date;

  @Column({ nullable: true })
  valid_until: Date;

  @Column({ type: 'enum', enum: ['pending', 'done', 'error'], default: 'pending' })
  status: ForecastStatus;

  @Column({ type: 'json', nullable: true })
  result_data: any;

  @Column({ type: 'text', nullable: true })
  error_message: string;
}
