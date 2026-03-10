import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { StoreUniversityTerm } from './entities/store-university-term.entity';

@Injectable()
export class UniversityTermService {
  constructor(
    @InjectConnection('ops') private readonly opsConnection: Connection,
  ) {}

  async upsertTerms(
    storeId: number,
    terms: Array<{ university: string; term_name: string; start_date: string; end_date: string }>,
  ): Promise<void> {
    const repo = this.opsConnection.getRepository(StoreUniversityTerm);
    for (const t of terms) {
      await repo.save({ store_id: storeId, ...t });
    }
  }

  async getUpcomingTerms(storeId: number): Promise<StoreUniversityTerm[]> {
    const repo = this.opsConnection.getRepository(StoreUniversityTerm);
    const today = new Date().toISOString().split('T')[0];
    return repo
      .createQueryBuilder('t')
      .where('t.store_id = :storeId', { storeId })
      .andWhere('t.end_date >= :today', { today })
      .orderBy('t.start_date', 'ASC')
      .getMany();
  }
}
