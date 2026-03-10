import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import axios from 'axios';
import { HolidayCache } from './entities/holiday-cache.entity';

@Injectable()
export class HolidayService {
  private readonly logger = new Logger(HolidayService.name);

  constructor(
    @InjectConnection('ops') private readonly opsConnection: Connection,
  ) {}

  async fetchAndCacheHolidays(year: number, region: 'CN' | 'GB'): Promise<void> {
    const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${region}`;
    this.logger.log(`Fetching holidays: ${url}`);

    const { data } = await axios.get<Array<{ date: string; localName: string; global: boolean }> >(url);
    const repo = this.opsConnection.getRepository(HolidayCache);

    for (const item of data) {
      await repo.upsert(
        {
          region,
          date: item.date,
          name: item.localName,
          is_workday_adjusted: false,
        },
        ['region', 'date'],
      );
    }
    this.logger.log(`Cached ${data.length} holidays for ${region} ${year}`);
  }

  async getHolidays(region: string, startDate: string, endDate: string): Promise<HolidayCache[]> {
    const repo = this.opsConnection.getRepository(HolidayCache);
    return repo
      .createQueryBuilder('h')
      .where('h.region = :region', { region })
      .andWhere('h.date BETWEEN :start AND :end', { start: startDate, end: endDate })
      .orderBy('h.date', 'ASC')
      .getMany();
  }
}
