import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { HolidayService } from './holiday.service';
import { WeatherService } from './weather.service';
import { UniversityTermService } from './university-term.service';

@Controller('schedule-context')
@UseGuards(JwtAuthGuard)
export class ScheduleContextController {
  constructor(
    private readonly holidayService: HolidayService,
    private readonly weatherService: WeatherService,
    private readonly universityTermService: UniversityTermService,
  ) {}

  @Get('info')
  async getInfo(
    @Query('storeId') storeId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const sid = storeId ? parseInt(storeId, 10) : null;
    const start = startDate || new Date().toISOString().split('T')[0];
    const end = endDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

    const [cnHolidays, gbHolidays, weather, universityTerms] = await Promise.all([
      this.holidayService.getHolidays('CN', start, end),
      this.holidayService.getHolidays('GB', start, end),
      sid ? this.weatherService.getWeather(sid, start, end) : Promise.resolve([]),
      sid ? this.universityTermService.getUpcomingTerms(sid) : Promise.resolve([]),
    ]);

    return {
      holidays: { CN: cnHolidays, GB: gbHolidays },
      weather,
      universityTerms,
    };
  }
}
