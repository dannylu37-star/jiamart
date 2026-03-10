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
}
