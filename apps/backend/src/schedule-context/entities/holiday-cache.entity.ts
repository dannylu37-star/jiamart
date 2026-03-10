import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";
@Entity("holiday_cache")
export class HolidayCache {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 10 }) region: string;
  @Column({ type: "date" }) date: string;
  @Column() name: string;
  @Column({ default: false }) is_workday_adjusted: boolean;
  @CreateDateColumn() created_at: Date;
}
