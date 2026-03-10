import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HolidayService } from './holiday.service';
import { WeatherService } from './weather.service';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

// Store coordinates — update when more stores are added
const STORE_COORDS: Record<number, { lat: number; lon: number }> = {
  1: { lat: 51.5074, lon: -0.1278 }, // London (default)
};

@Injectable()
export class ScheduleContextCron {
  private readonly logger = new Logger(ScheduleContextCron.name);

  constructor(
    private readonly holidayService: HolidayService,
    private readonly weatherService: WeatherService,
    @InjectConnection('ops') private readonly opsConnection: Connection,
  ) {}

  // Every day at 02:00 — refresh weather for all stores
  @Cron('0 2 * * *')
  async refreshWeather() {
    this.logger.log('Cron: refreshing weather for all stores');
    for (const [storeId, coords] of Object.entries(STORE_COORDS)) {
      try {
        await this.weatherService.fetchAndCacheWeather(Number(storeId), coords.lat, coords.lon);
      } catch (e) {
        this.logger.error(`Weather fetch failed for store ${storeId}: ${e.message}`);
      }
    }
  }

  // November 1st at 06:00 — fetch next year's holidays
  @Cron('0 6 1 11 *')
  async refreshHolidays() {
    const nextYear = new Date().getFullYear() + 1;
    this.logger.log(`Cron: fetching ${nextYear} holidays for CN and GB`);
    await Promise.all([
      this.holidayService.fetchAndCacheHolidays(nextYear, 'CN'),
      this.holidayService.fetchAndCacheHolidays(nextYear, 'GB'),
    ]);
  }
}
