import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
@Entity("store_university_terms")
export class StoreUniversityTerm {
  @PrimaryGeneratedColumn() id: number;
  @Column() store_id: number;
  @Column() university: string;
  @Column() term_name: string;
  @Column({ type: "date" }) start_date: string;
  @Column({ type: "date" }) end_date: string;
}
