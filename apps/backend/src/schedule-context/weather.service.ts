import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import axios from 'axios';
import { StoreWeather } from './entities/store-weather.entity';

interface OpenMeteoDaily {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max: number[];
  weathercode: number[];
}

function weatherCodeToCondition(code: number): string {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly cloudy';
  if (code <= 49) return 'Foggy';
  if (code <= 69) return 'Rainy';
  if (code <= 79) return 'Snowy';
  if (code <= 99) return 'Stormy';
  return 'Unknown';
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(
    @InjectConnection('ops') private readonly opsConnection: Connection,
  ) {}

  async fetchAndCacheWeather(storeId: number, lat: number, lon: number): Promise<void> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&timezone=Europe/London&forecast_days=7`;
    this.logger.log(`Fetching weather for store ${storeId}`);

    const { data } = await axios.get<{ daily: OpenMeteoDaily }>(url);
    const daily = data.daily;
    const repo = this.opsConnection.getRepository(StoreWeather);

    for (let i = 0; i < daily.time.length; i++) {
      await repo.upsert(
        {
          store_id: storeId,
          forecast_date: daily.time[i],
          temp_max: daily.temperature_2m_max[i],
          temp_min: daily.temperature_2m_min[i],
          precip_prob: daily.precipitation_probability_max[i],
          condition: weatherCodeToCondition(daily.weathercode[i]),
        },
        ['store_id', 'forecast_date'],
      );
    }
  }

  async getWeather(storeId: number, startDate: string, endDate: string): Promise<StoreWeather[]> {
    const repo = this.opsConnection.getRepository(StoreWeather);
    return repo
      .createQueryBuilder('w')
      .where('w.store_id = :storeId', { storeId })
      .andWhere('w.forecast_date BETWEEN :start AND :end', { start: startDate, end: endDate })
      .orderBy('w.forecast_date', 'ASC')
      .getMany();
  }
}
