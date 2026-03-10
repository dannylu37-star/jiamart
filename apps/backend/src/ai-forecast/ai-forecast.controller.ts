import { Controller, Post, Get, Patch, Query, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AiForecastService } from './ai-forecast.service';
import type { ForecastType } from './entities/forecast-run.entity';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { ScheduleDraft } from './entities/schedule-draft.entity';
import { PurchaseDraft } from './entities/purchase-draft.entity';

@Controller('ai-forecast')
@UseGuards(JwtAuthGuard)
export class AiForecastController {
  constructor(
    private readonly forecastService: AiForecastService,
    @InjectConnection('ops') private readonly opsConnection: Connection,
  ) {}

  /** POST /ai-forecast/generate?storeId=1 — 生成全量预测 */
  @Post('generate')
  generate(@Query('storeId') storeId?: string) {
    return this.forecastService.generateAll(storeId ? parseInt(storeId, 10) : undefined);
  }

  /** POST /ai-forecast/generate/:type?storeId=1 — 生成指定类型 */
  @Post('generate/:type')
  generateType(
    @Param('type') type: ForecastType,
    @Query('storeId') storeId?: string,
  ) {
    return this.forecastService.generate(
      storeId ? parseInt(storeId, 10) : undefined,
      type,
    );
  }

  /** GET /ai-forecast/latest/:type?storeId=1 — 获取最新预测结果 */
  @Get('latest/:type')
  getLatest(
    @Param('type') type: ForecastType,
    @Query('storeId') storeId?: string,
  ) {
    return this.forecastService.getLatest(
      storeId ? parseInt(storeId, 10) : undefined,
      type,
    );
  }

  /** GET /ai-forecast/schedule-drafts?storeId=1 — 获取排班草稿 */
  @Get('schedule-drafts')
  getScheduleDrafts(@Query('storeId') storeId?: string) {
    const repo = this.opsConnection.getRepository(ScheduleDraft);
    const where: any = { status: 'suggested' };
    if (storeId) where.store_id = parseInt(storeId, 10);
    return repo.find({ where, order: { shift_date: 'ASC', shift_start: 'ASC' } });
  }

  /** GET /ai-forecast/purchase-drafts?storeId=1 — 获取采购建议 */
  @Get('purchase-drafts')
  getPurchaseDrafts(@Query('storeId') storeId?: string) {
    const repo = this.opsConnection.getRepository(PurchaseDraft);
    const where: any = { status: 'suggested' };
    if (storeId) where.store_id = parseInt(storeId, 10);
    return repo.find({ where, order: { suggested_qty: 'DESC' } });
  }

  /** PATCH /ai-forecast/schedule-drafts/:id/confirm */
  @Patch('schedule-drafts/:id/confirm')
  confirmSchedule(@Param('id', ParseIntPipe) id: number) {
    return this.forecastService.confirmScheduleDraft(id);
  }

  /** PATCH /ai-forecast/purchase-drafts/:id/confirm */
  @Patch('purchase-drafts/:id/confirm')
  confirmPurchase(@Param('id', ParseIntPipe) id: number) {
    return this.forecastService.confirmPurchaseDraft(id);
  }

  /** PATCH /ai-forecast/schedule-drafts/:id/reject */
  @Patch('schedule-drafts/:id/reject')
  rejectSchedule(@Param('id', ParseIntPipe) id: number) {
    return this.forecastService.rejectDraft('schedule', id);
  }

  /** PATCH /ai-forecast/purchase-drafts/:id/reject */
  @Patch('purchase-drafts/:id/reject')
  rejectPurchase(@Param('id', ParseIntPipe) id: number) {
    return this.forecastService.rejectDraft('purchase', id);
  }

  /** GET /ai-forecast/analytics/daily?storeSuffix=s1&days=90 — 历史日报 */
  @Get('analytics/daily')
  async getDailyAnalytics(
    @Query('storeSuffix') storeSuffix = 's1',
    @Query('days') days = '90',
  ) {
    const suffix = storeSuffix.replace(/[^a-z0-9]/gi, ''); // sanitize
    const d = parseInt(days) || 90;
    const rows = await this.opsConnection.query(`
      SELECT
        data_day,
        SUM(sales)   AS sales,
        SUM(card)    AS card,
        SUM(cash)    AS cash,
        SUM(wechat)  AS wechat,
        SUM(justEat) AS justEat
      FROM jiamart_shop.sp_day_tol_${suffix}
      WHERE data_day >= DATE_SUB(CURDATE(), INTERVAL ${d} DAY)
      GROUP BY data_day
      ORDER BY data_day ASC
    `).catch(() => []);
    return { data: rows };
  }

  /** GET /ai-forecast/analytics/top-products?storeSuffix=s1&days=30 — 畅销商品 */
  @Get('analytics/top-products')
  async getTopProducts(
    @Query('storeSuffix') storeSuffix = 's1',
    @Query('days') days = '30',
    @Query('limit') limit = '20',
  ) {
    const suffix = storeSuffix.replace(/[^a-z0-9]/gi, '');
    const d = parseInt(days) || 30;
    const lim = parseInt(limit) || 20;
    const rows = await this.opsConnection.query(`
      SELECT
        d.product_id,
        d.chinese_name,
        d.english_name,
        SUM(d.numbers)                                         AS total_qty,
        ROUND(SUM(d.total_price_after_dis), 2)                 AS total_revenue,
        ROUND(SUM(d.numbers) / COUNT(DISTINCT DATE(FROM_UNIXTIME(o.pay_time))), 2) AS daily_avg
      FROM jiamart_shop.sp_epos_order_details_${suffix} d
      JOIN jiamart_shop.sp_epos_order_${suffix} o ON o.id = d.epos_id
      WHERE FROM_UNIXTIME(o.pay_time) >= DATE_SUB(CURDATE(), INTERVAL ${d} DAY)
        AND d.chinese_name NOT IN ('item', '袋子', 'bag')
      GROUP BY d.product_id, d.chinese_name, d.english_name
      ORDER BY total_qty DESC
      LIMIT ${lim}
    `).catch(() => []);
    return { data: rows };
  }

  /** GET /ai-forecast/analytics/payment-mix?storeSuffix=s1&days=30 — 支付方式分析 */
  @Get('analytics/payment-mix')
  async getPaymentMix(
    @Query('storeSuffix') storeSuffix = 's1',
    @Query('days') days = '30',
  ) {
    const suffix = storeSuffix.replace(/[^a-z0-9]/gi, '');
    const d = parseInt(days) || 30;
    const rows = await this.opsConnection.query(`
      SELECT
        ROUND(SUM(card), 2)    AS card,
        ROUND(SUM(cash), 2)    AS cash,
        ROUND(SUM(wechat), 2)  AS wechat,
        ROUND(SUM(justEat), 2) AS justEat,
        ROUND(SUM(sales), 2)   AS total
      FROM jiamart_shop.sp_day_tol_${suffix}
      WHERE data_day >= DATE_SUB(CURDATE(), INTERVAL ${d} DAY)
    `).catch(() => []);
    return { data: rows[0] || {} };
  }
}
