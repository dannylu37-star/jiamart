import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

export interface SalesForecastDay {
  date: string;
  dayOfWeek: string;
  predictedRevenue: number;
  predictedOrders: number;
  confidence: 'high' | 'medium' | 'low';
}

export interface SalesForecastWeek {
  weekStart: string;
  weekEnd: string;
  predictedRevenue: number;
  predictedOrders: number;
}

const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

@Injectable()
export class SalesForecastService {
  private readonly logger = new Logger(SalesForecastService.name);

  constructor(@InjectConnection('ops') private readonly opsConnection: Connection) {}

  /** 7天日级预测 */
  async forecast7d(storeId?: number): Promise<SalesForecastDay[]> {
    // 拉过去 90 天销售，按星期几聚合均值 + 最近趋势
    const storeFilter = storeId ? `AND store_id = ${storeId}` : '';
    // 优先用 EPOS 数据（线下POS，更完整）；无 store_id 过滤时用 _s1 (Burleigh St)
    const daily: Array<{ sale_date: string; revenue: string; orders: string }> =
      await this.opsConnection.query(`
        SELECT
          DATE(FROM_UNIXTIME(pay_time)) AS sale_date,
          SUM(total_money_after_discount) AS revenue,
          COUNT(*) AS orders
        FROM jiamart_shop.sp_epos_order_s1
        WHERE pay_time IS NOT NULL
          AND FROM_UNIXTIME(pay_time) >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
        GROUP BY DATE(FROM_UNIXTIME(pay_time))
        ORDER BY sale_date
      `).catch(() => []);

    // 按星期几计算均值
    const dowRevenue: Record<number, number[]> = {};
    const dowOrders: Record<number, number[]> = {};
    for (const row of daily) {
      const dow = new Date(row.sale_date).getDay();
      if (!dowRevenue[dow]) { dowRevenue[dow] = []; dowOrders[dow] = []; }
      dowRevenue[dow].push(parseFloat(row.revenue));
      dowOrders[dow].push(parseInt(row.orders));
    }

    const avgRevByDow: Record<number, number> = {};
    const avgOrdByDow: Record<number, number> = {};
    for (let d = 0; d < 7; d++) {
      const revs = dowRevenue[d] || [];
      const ords = dowOrders[d] || [];
      avgRevByDow[d] = revs.length ? revs.reduce((a, b) => a + b, 0) / revs.length : 0;
      avgOrdByDow[d] = ords.length ? ords.reduce((a, b) => a + b, 0) / ords.length : 0;
    }

    // 最近7天趋势系数（与前7天均值比）
    const recent7 = daily.slice(-7).map(r => parseFloat(r.revenue));
    const prev7 = daily.slice(-14, -7).map(r => parseFloat(r.revenue));
    const recentAvg = recent7.length ? recent7.reduce((a, b) => a + b, 0) / recent7.length : 1;
    const prevAvg = prev7.length ? prev7.reduce((a, b) => a + b, 0) / prev7.length : recentAvg;
    const trend = prevAvg > 0 ? recentAvg / prevAvg : 1;

    // 生成未来7天
    const today = new Date();
    const result: SalesForecastDay[] = [];
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today.getTime() + i * 86400000);
      const dow = d.getDay();
      const dateStr = d.toISOString().split('T')[0];
      const rev = (avgRevByDow[dow] ?? 0) * trend;
      const ord = (avgOrdByDow[dow] ?? 0) * trend;
      result.push({
        date: dateStr,
        dayOfWeek: DOW[dow],
        predictedRevenue: Math.round(rev * 100) / 100,
        predictedOrders: Math.round(ord),
        confidence: daily.length >= 30 ? 'high' : daily.length >= 14 ? 'medium' : 'low',
      });
    }
    return result;
  }

  /** 30天周级预测 */
  async forecast30d(storeId?: number): Promise<SalesForecastWeek[]> {
    const storeFilter = storeId ? `AND store_id = ${storeId}` : '';
    const weekly: Array<{ week_start: string; revenue: string; orders: string }> =
      await this.opsConnection.query(`
        SELECT
          DATE(DATE_SUB(FROM_UNIXTIME(pay_time), INTERVAL WEEKDAY(FROM_UNIXTIME(pay_time)) DAY)) AS week_start,
          SUM(total_money_after_discount) AS revenue,
          COUNT(*) AS orders
        FROM jiamart_shop.sp_epos_order_s1
        WHERE pay_time IS NOT NULL
          AND FROM_UNIXTIME(pay_time) >= DATE_SUB(CURDATE(), INTERVAL 180 DAY)
        GROUP BY week_start
        ORDER BY week_start
      `).catch(() => []);

    const recentWeeks = weekly.slice(-8);
    const avgRev = recentWeeks.length
      ? recentWeeks.reduce((s, r) => s + parseFloat(r.revenue), 0) / recentWeeks.length
      : 0;
    const avgOrd = recentWeeks.length
      ? recentWeeks.reduce((s, r) => s + parseInt(r.orders), 0) / recentWeeks.length
      : 0;

    // 最近4周 vs 前4周趋势
    const r4 = weekly.slice(-4).map(r => parseFloat(r.revenue));
    const p4 = weekly.slice(-8, -4).map(r => parseFloat(r.revenue));
    const r4avg = r4.length ? r4.reduce((a, b) => a + b, 0) / r4.length : avgRev;
    const p4avg = p4.length ? p4.reduce((a, b) => a + b, 0) / p4.length : r4avg;
    const weeklyTrend = p4avg > 0 ? r4avg / p4avg : 1;

    const today = new Date();
    const result: SalesForecastWeek[] = [];
    for (let w = 0; w < 4; w++) {
      const weekStart = new Date(today.getTime() + w * 7 * 86400000);
      const weekEnd = new Date(weekStart.getTime() + 6 * 86400000);
      const multiplier = Math.pow(weeklyTrend, w + 1);
      result.push({
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        predictedRevenue: Math.round(avgRev * multiplier * 100) / 100,
        predictedOrders: Math.round(avgOrd * multiplier),
      });
    }
    return result;
  }
}
