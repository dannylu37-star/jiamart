# Schedule-Context Module Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `schedule-context` module to the NestJS backend that caches holidays, weather forecasts, and university terms for scheduling use.

**Architecture:** Three TypeORM entities on the "ops" database connection, three services (HolidayService, WeatherService, UniversityTermService) plus an aggregator ScheduleContextService with cron jobs, one controller, one module.

**Tech Stack:** NestJS 11, TypeORM (ops connection), @nestjs/schedule (cron), axios (HTTP), MySQL

---

## Prerequisites

**@nestjs/schedule, @nestjs/axios, axios not installed — must install first.**

---

### Task 1: Install missing dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install packages**

```bash
npm install @nestjs/schedule @nestjs/axios axios
```

**Step 2: Verify install**

```bash
npm ls @nestjs/schedule @nestjs/axios axios
```
Expected: version numbers printed, no errors.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @nestjs/schedule, @nestjs/axios, axios"
```

---

### Task 2: Create entity files

**Files:**
- Create: `src/schedule-context/entities/holiday-cache.entity.ts`
- Create: `src/schedule-context/entities/store-weather.entity.ts`
- Create: `src/schedule-context/entities/store-university-term.entity.ts`

**Step 1: Create holiday-cache.entity.ts**

```typescript
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
```

**Step 2: Create store-weather.entity.ts**

```typescript
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
```

**Step 3: Create store-university-term.entity.ts**

```typescript
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
```

**Step 4: Commit**

```bash
git add src/schedule-context/entities/
git commit -m "feat: add schedule-context entities (holiday, weather, university term)"
```

---

### Task 3: Create schedule-context.service.ts

**Files:**
- Create: `src/schedule-context/schedule-context.service.ts`

**Step 1: Write the service**

```typescript
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { Cron } from "@nestjs/schedule";
import axios from "axios";
import { HolidayCache } from "./entities/holiday-cache.entity.js";
import { StoreWeather } from "./entities/store-weather.entity.js";
import { StoreUniversityTerm } from "./entities/store-university-term.entity.js";

@Injectable()
export class HolidayService {
  private readonly logger = new Logger(HolidayService.name);
  constructor(
    @InjectRepository(HolidayCache, "ops")
    private readonly holidayCacheRepo: Repository<HolidayCache>,
  ) {}

  async fetchAndCacheHolidays(year: number, region: string): Promise<void> {
    const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${region}`;
    const { data } = await axios.get<{ date: string; name: string }[]>(url);
    for (const h of data) {
      const existing = await this.holidayCacheRepo.findOne({
        where: { region, date: h.date },
      });
      if (existing) {
        existing.name = h.name;
        await this.holidayCacheRepo.save(existing);
      } else {
        await this.holidayCacheRepo.save(
          this.holidayCacheRepo.create({ region, date: h.date, name: h.name }),
        );
      }
    }
    this.logger.log(`Cached ${data.length} holidays for ${region} ${year}`);
  }
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  constructor(
    @InjectRepository(StoreWeather, "ops")
    private readonly storeWeatherRepo: Repository<StoreWeather>,
  ) {}

  async fetchAndCacheWeather(storeId: number, lat: number, lon: number): Promise<void> {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode` +
      `&forecast_days=7&timezone=auto`;
    const { data } = await axios.get<{
      daily: {
        time: string[];
        temperature_2m_max: number[];
        temperature_2m_min: number[];
        precipitation_probability_max: number[];
        weathercode: number[];
      };
    }>(url);
    const { time, temperature_2m_max, temperature_2m_min, precipitation_probability_max, weathercode } = data.daily;
    for (let i = 0; i < time.length; i++) {
      const existing = await this.storeWeatherRepo.findOne({
        where: { store_id: storeId, forecast_date: time[i] },
      });
      const payload = {
        store_id: storeId,
        forecast_date: time[i],
        temp_max: temperature_2m_max[i],
        temp_min: temperature_2m_min[i],
        precip_prob: precipitation_probability_max[i],
        condition: String(weathercode[i]),
      };
      if (existing) {
        await this.storeWeatherRepo.save({ ...existing, ...payload });
      } else {
        await this.storeWeatherRepo.save(this.storeWeatherRepo.create(payload));
      }
    }
    this.logger.log(`Cached weather for store ${storeId}`);
  }
}

@Injectable()
export class UniversityTermService {
  constructor(
    @InjectRepository(StoreUniversityTerm, "ops")
    private readonly termRepo: Repository<StoreUniversityTerm>,
  ) {}

  async upsertTerms(
    storeId: number,
    terms: { university: string; term_name: string; start_date: string; end_date: string }[],
  ): Promise<void> {
    for (const t of terms) {
      const existing = await this.termRepo.findOne({
        where: { store_id: storeId, university: t.university, term_name: t.term_name },
      });
      if (existing) {
        await this.termRepo.save({ ...existing, ...t });
      } else {
        await this.termRepo.save(this.termRepo.create({ store_id: storeId, ...t }));
      }
    }
  }
}

@Injectable()
export class ScheduleContextService {
  private readonly logger = new Logger(ScheduleContextService.name);

  constructor(
    @InjectRepository(HolidayCache, "ops")
    private readonly holidayCacheRepo: Repository<HolidayCache>,
    @InjectRepository(StoreWeather, "ops")
    private readonly storeWeatherRepo: Repository<StoreWeather>,
    @InjectRepository(StoreUniversityTerm, "ops")
    private readonly termRepo: Repository<StoreUniversityTerm>,
    private readonly weatherService: WeatherService,
    private readonly holidayService: HolidayService,
  ) {}

  async getContextInfo(storeId: number, startDate: string, endDate: string) {
    const [holidays, weather, universityTerms] = await Promise.all([
      this.holidayCacheRepo.find({
        where: { date: Between(startDate, endDate) as any },
      }),
      this.storeWeatherRepo.find({
        where: { store_id: storeId, forecast_date: Between(startDate, endDate) as any },
      }),
      this.termRepo
        .createQueryBuilder("t")
        .where("t.store_id = :storeId", { storeId })
        .andWhere("t.start_date <= :endDate", { endDate })
        .andWhere("t.end_date >= :startDate", { startDate })
        .getMany(),
    ]);
    return { holidays, weather, universityTerms };
  }

  @Cron("0 2 * * *")
  async refreshWeather() {
    this.logger.log("Cron: refresh weather (no-op without store coords)");
  }

  @Cron("0 0 1 11 *")
  async refreshNextYearHolidays() {
    const nextYear = new Date().getFullYear() + 1;
    this.logger.log(`Cron: refresh holidays for ${nextYear}`);
  }
}
```

**Step 2: Commit**

```bash
git add src/schedule-context/schedule-context.service.ts
git commit -m "feat: add schedule-context services with cron jobs"
```

---

### Task 4: Create controller

**Files:**
- Create: `src/schedule-context/schedule-context.controller.ts`

**Step 1: Write the controller**

```typescript
import { Controller, Get, Query, ParseIntPipe } from "@nestjs/common";
import { ScheduleContextService } from "./schedule-context.service.js";

@Controller("schedule-context")
export class ScheduleContextController {
  constructor(private readonly scheduleContextService: ScheduleContextService) {}

  @Get("info")
  getInfo(
    @Query("storeId", ParseIntPipe) storeId: number,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.scheduleContextService.getContextInfo(storeId, startDate, endDate);
  }
}
```

**Step 2: Commit**

```bash
git add src/schedule-context/schedule-context.controller.ts
git commit -m "feat: add schedule-context controller GET /schedule-context/info"
```

---

### Task 5: Create module

**Files:**
- Create: `src/schedule-context/schedule-context.module.ts`

**Step 1: Write the module**

```typescript
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
import { HttpModule } from "@nestjs/axios";
import { HolidayCache } from "./entities/holiday-cache.entity.js";
import { StoreWeather } from "./entities/store-weather.entity.js";
import { StoreUniversityTerm } from "./entities/store-university-term.entity.js";
import {
  HolidayService,
  WeatherService,
  UniversityTermService,
  ScheduleContextService,
} from "./schedule-context.service.js";
import { ScheduleContextController } from "./schedule-context.controller.js";

@Module({
  imports: [
    TypeOrmModule.forFeature([HolidayCache, StoreWeather, StoreUniversityTerm], "ops"),
    ScheduleModule.forRoot(),
    HttpModule,
  ],
  controllers: [ScheduleContextController],
  providers: [HolidayService, WeatherService, UniversityTermService, ScheduleContextService],
  exports: [ScheduleContextService, HolidayService, WeatherService, UniversityTermService],
})
export class ScheduleContextModule {}
```

**Step 2: Commit**

```bash
git add src/schedule-context/schedule-context.module.ts
git commit -m "feat: add ScheduleContextModule"
```

---

### Task 6: Create SQL migration file

**Files:**
- Create: `src/schedule-context/migrations/create_schedule_context_tables.sql`

**Step 1: Write the SQL**

```sql
CREATE TABLE IF NOT EXISTS holiday_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  region VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  name VARCHAR(255) NOT NULL,
  is_workday_adjusted TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_holiday_region_date (region, date)
);

CREATE TABLE IF NOT EXISTS store_weather (
  id INT AUTO_INCREMENT PRIMARY KEY,
  store_id INT NOT NULL,
  forecast_date DATE NOT NULL,
  temp_max FLOAT NULL,
  temp_min FLOAT NULL,
  precip_prob FLOAT NULL,
  `condition` VARCHAR(255) NULL,
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_weather_store_date (store_id, forecast_date)
);

CREATE TABLE IF NOT EXISTS store_university_terms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  store_id INT NOT NULL,
  university VARCHAR(255) NOT NULL,
  term_name VARCHAR(255) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL
);
```

**Step 2: Commit**

```bash
git add src/schedule-context/migrations/
git commit -m "feat: add SQL migration for schedule_context tables"
```

---

### Task 7: Register ScheduleContextModule in app.module.ts

**Files:**
- Modify: `src/app.module.ts`

**Step 1: Read current app.module.ts to find the imports array**

Read the file and add `ScheduleContextModule` to the imports array. Also add the import statement at the top.

**Step 2: Add import statement** at the top of the file:

```typescript
import { ScheduleContextModule } from "./schedule-context/schedule-context.module.js";
```

**Step 3: Add to imports array** — append `ScheduleContextModule` to the imports array.

**Step 4: Commit**

```bash
git add src/app.module.ts
git commit -m "feat: register ScheduleContextModule in AppModule"
```

---

### Task 8: Build and verify

**Step 1: Run build**

```bash
npm run build
```

Expected: exits with code 0, no TypeScript errors.

**Step 2: If errors:** Fix them (likely import path issues with `.js` extension for nodenext, or missing type annotations).

**Step 3: Final commit if any fixes needed**

---
