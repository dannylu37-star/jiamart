import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from "typeorm";
@Entity("store_weather")
export class StoreWeather {
  @PrimaryGeneratedColumn() id: number;
  @Column() store_id: number;
  @Column({ type: "date" }) forecast_date: string;
  @Column({ type: "float", nullable: true }) temp_max: number;
  @Column({ type: "float", nullable: true }) temp_min: number;
  @Column({ type: "float", nullable: true }) precip_prob: number;
  @Column({ nullable: true }) condition: string;
  @UpdateDateColumn() updated_at: Date;
}
