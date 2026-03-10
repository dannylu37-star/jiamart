import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { HolidayCache } from './entities/holiday-cache.entity';
import { StoreWeather } from './entities/store-weather.entity';
import { StoreUniversityTerm } from './entities/store-university-term.entity';
import { HolidayService } from './holiday.service';
import { WeatherService } from './weather.service';
import { UniversityTermService } from './university-term.service';
import { ScheduleContextController } from './schedule-context.controller';
import { ScheduleContextCron } from './schedule-context.cron';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([HolidayCache, StoreWeather, StoreUniversityTerm], 'ops'),
  ],
  providers: [HolidayService, WeatherService, UniversityTermService, ScheduleContextCron],
  controllers: [ScheduleContextController],
  exports: [HolidayService, WeatherService, UniversityTermService],
})
export class ScheduleContextModule {}
