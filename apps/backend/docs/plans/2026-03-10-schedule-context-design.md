# schedule-context Module Design
Date: 2026-03-10

## Purpose
Provide contextual scheduling data (holidays, weather forecasts, university terms) for store operations planning, exposed via a single aggregation endpoint.

## Architecture

### New dependencies
- `@nestjs/schedule` — @Cron decorator support
- `axios` — HTTP client for external APIs (Nager.Date, Open-Meteo)

### File structure
```
src/schedule-context/
├── schedule-context.module.ts
├── schedule-context.controller.ts
├── entities/
│   ├── holiday-cache.entity.ts
│   ├── store-weather.entity.ts
│   └── store-university-term.entity.ts
├── services/
│   ├── holiday.service.ts
│   ├── weather.service.ts
│   └── university-term.service.ts
├── tasks/
│   └── schedule-context.tasks.ts
└── migrations/
    └── create_schedule_context_tables.sql
```

### Entities (all on `ops` connection / jiamart_ops DB)
- `holiday_cache`: id, region, date, name, is_workday_adjusted, created_at
- `store_weather`: id, store_id, forecast_date, temp_max, temp_min, precip_prob, condition, updated_at
- `store_university_terms`: id, store_id, university, term_name, start_date, end_date

### Services
- `HolidayService.fetchAndCacheHolidays(year, region)` → calls Nager.Date API → upserts holiday_cache
- `WeatherService.fetchAndCacheWeather(storeId, lat, lon)` → calls Open-Meteo API → upserts store_weather
- `UniversityTermService.upsertTerms(storeId, terms[])` → manual import

### Controller
`GET /api/v1/schedule-context/info?storeId=&startDate=&endDate=`
Protected with JwtAuthGuard. Returns `{ holidays, weather, universityTerms }`.

### Cron tasks
- `0 2 * * *` — refresh weather for all stores (fetches coordinates from StoreEntity)
- `0 0 1 11 *` — fetch next-year holidays for CN + GB

### app.module.ts
Add `ScheduleContextModule` to imports array, and `ScheduleModule.forRoot()`.
