import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

export interface StaffingDay {
  date: string;
  dayOfWeek: string;
  suggestedHeadcount: number;
  isHoliday: boolean;
  holidayName?: string;
  weatherWarning: boolean;
  shifts: Array<{ start: string; end: string; role: string; staffCount: number }>;
}

const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

@Injectable()
export class StaffingForecastService {
  private readonly logger = new Logger(StaffingForecastService.name);

  constructor(@InjectConnection('ops') private readonly opsConnection: Connection) {}

  async forecast(storeId: number, days = 14): Promise<StaffingDay[]> {
    // 1. 拉过去 60 天的出勤数据，按 [星期几] 聚合平均人数
    let rawAttendance: Array<{ dow: number; avg_staff: string }> = await this.opsConnection.query(`
      SELECT
        DAYOFWEEK(DATE(a.clock_in)) - 1 AS dow,
        COUNT(DISTINCT a.staff_id) / COUNT(DISTINCT DATE(a.clock_in)) AS avg_staff
      FROM ops_attendance a
      JOIN ops_staff s ON s.id = a.staff_id
      WHERE a.clock_in >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
        AND (${storeId ? `s.store_id = ${storeId}` : '1=1'})
      GROUP BY dow
    `).catch(() => []);

    // Fallback：考勤数据不足时，用 sp_day_tol 日报销售额反推（人均£180/天）
    if (rawAttendance.length < 5) {
      this.logger.log('Attendance data insufficient, falling back to day_tol sales-based estimate');
      const dayTol: Array<{ dow: number; avg_sales: string }> = await this.opsConnection.query(`
        SELECT
          DAYOFWEEK(data_day) - 1 AS dow,
          AVG(sales) AS avg_sales
        FROM jiamart_shop.sp_day_tol_s1
        WHERE data_day >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
        GROUP BY dow
      `).catch(() => []);
      rawAttendance = dayTol.map(r => ({
        dow: r.dow,
        avg_staff: String(Math.max(2, Math.round(parseFloat(r.avg_sales) / 180))),
      }));
    }

    const dowAvg: Record<number, number> = {};
    for (const row of rawAttendance) {
      dowAvg[row.dow] = parseFloat(row.avg_staff) || 0;
    }

    // 2. 拉未来 14 天的节假日 + 天气
    const today = new Date();
    const endDate = new Date(today.getTime() + days * 86400000);
    const startStr = today.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const holidays: Array<{ date: string; name: string }> = await this.opsConnection.query(
      `SELECT date, name FROM holiday_cache WHERE date BETWEEN ? AND ? AND region IN ('CN','GB')`,
      [startStr, endStr],
    );
    const holidayMap: Record<string, string> = {};
    for (const h of holidays) {
      holidayMap[h.date] = h.name;
    }

    const weatherRows: Array<{ forecast_date: string; precip_prob: number }> = storeId
      ? await this.opsConnection.query(
          `SELECT forecast_date, precip_prob FROM store_weather WHERE store_id = ? AND forecast_date BETWEEN ? AND ?`,
          [storeId, startStr, endStr],
        )
      : [];
    const weatherMap: Record<string, number> = {};
    for (const w of weatherRows) {
      weatherMap[w.forecast_date] = w.precip_prob;
    }

    // 3. 生成 14 天建议
    const result: StaffingDay[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(today.getTime() + i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const dow = d.getDay(); // 0=Sun

      let base = dowAvg[dow] ?? 3; // fallback 3 人

      // 节假日 × 1.3，天气差（降雨>60%）× 0.85
      const isHoliday = !!holidayMap[dateStr];
      const precipProb = weatherMap[dateStr] ?? 0;
      if (isHoliday) base *= 1.3;
      if (precipProb > 60) base *= 0.85;

      const headcount = Math.max(2, Math.round(base));

      // 简单班次分配：headcount 人分 morning/afternoon/closing
      const shifts = generateShifts(headcount);

      result.push({
        date: dateStr,
        dayOfWeek: DOW[dow],
        suggestedHeadcount: headcount,
        isHoliday,
        holidayName: holidayMap[dateStr],
        weatherWarning: precipProb > 60,
        shifts,
      });
    }

    return result;
  }
}

function generateShifts(total: number): StaffingDay['shifts'] {
  // 简单分配：多数人排主班，1人开档，1人收档
  const morning = Math.max(1, Math.floor(total * 0.4));
  const afternoon = Math.max(1, total - morning - 1);
  const closing = 1;
  return [
    { start: '08:00', end: '16:00', role: 'Morning', staffCount: morning },
    { start: '12:00', end: '20:00', role: 'Afternoon', staffCount: afternoon },
    { start: '16:00', end: '23:00', role: 'Closing', staffCount: closing },
  ];
}
