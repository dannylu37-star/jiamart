import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { ForecastRun, ForecastType } from './entities/forecast-run.entity';
import { ScheduleDraft } from './entities/schedule-draft.entity';
import { PurchaseDraft } from './entities/purchase-draft.entity';
import { StaffingForecastService } from './staffing-forecast.service';
import { SalesForecastService } from './sales-forecast.service';
import { InventoryForecastService } from './inventory-forecast.service';

@Injectable()
export class AiForecastService {
  private readonly logger = new Logger(AiForecastService.name);

  constructor(
    @InjectConnection('ops') private readonly opsConnection: Connection,
    private readonly staffingService: StaffingForecastService,
    private readonly salesService: SalesForecastService,
    private readonly inventoryService: InventoryForecastService,
  ) {}

  /** 生成全量预测（排班 + 销售 + 库存） */
  async generateAll(storeId?: number): Promise<{
    staffing: ForecastRun;
    sales7d: ForecastRun;
    sales30d: ForecastRun;
    inventory: ForecastRun;
  }> {
    const [staffing, sales7d, sales30d, inventory] = await Promise.all([
      this.generate(storeId, 'staffing'),
      this.generate(storeId, 'sales_7d'),
      this.generate(storeId, 'sales_30d'),
      this.generate(storeId, 'inventory'),
    ]);
    return { staffing, sales7d, sales30d, inventory };
  }

  async generate(storeId: number | undefined, type: ForecastType): Promise<ForecastRun> {
    const repo = this.opsConnection.getRepository(ForecastRun);
    const run = repo.create({ store_id: storeId ?? null as any, forecast_type: type, status: 'pending' });
    await repo.save(run);

    try {
      let result: any;
      switch (type) {
        case 'staffing':
          result = await this.staffingService.forecast(storeId as number, 14);
          await this.saveScheduleDrafts(run.id, storeId as number, result);
          break;
        case 'sales_7d':
          result = await this.salesService.forecast7d(storeId);
          break;
        case 'sales_30d':
          result = await this.salesService.forecast30d(storeId);
          break;
        case 'inventory':
          result = await this.inventoryService.forecast(storeId);
          await this.savePurchaseDrafts(run.id, storeId as number, result);
          break;
      }

      const validUntil = new Date();
      validUntil.setHours(validUntil.getHours() + 6); // 6小时缓存

      await repo.update(run.id, { status: 'done', result_data: result, valid_until: validUntil });
      run.result_data = result;
      run.status = 'done';
    } catch (e) {
      this.logger.error(`Forecast ${type} failed: ${e.message}`);
      await repo.update(run.id, { status: 'error', error_message: e.message });
      run.status = 'error';
    }

    return run;
  }

  async getLatest(storeId: number | undefined, type: ForecastType): Promise<ForecastRun | null> {
    const repo = this.opsConnection.getRepository(ForecastRun);
    return repo.findOne({
      where: { store_id: (storeId ?? null) as any, forecast_type: type, status: 'done' },
      order: { generated_at: 'DESC' },
    });
  }

  async confirmScheduleDraft(draftId: number): Promise<void> {
    const repo = this.opsConnection.getRepository(ScheduleDraft);
    await repo.update(draftId, { status: 'confirmed' });
  }

  async confirmPurchaseDraft(draftId: number): Promise<void> {
    const repo = this.opsConnection.getRepository(PurchaseDraft);
    await repo.update(draftId, { status: 'confirmed' });
  }

  async rejectDraft(type: 'schedule' | 'purchase', draftId: number): Promise<void> {
    if (type === 'schedule') {
      await this.opsConnection.getRepository(ScheduleDraft).update(draftId, { status: 'rejected' });
    } else {
      await this.opsConnection.getRepository(PurchaseDraft).update(draftId, { status: 'rejected' });
    }
  }

  private async saveScheduleDrafts(runId: number, storeId: number, staffingDays: any[]): Promise<void> {
    const repo = this.opsConnection.getRepository(ScheduleDraft);
    // 清除旧的 suggested drafts
    if (storeId) {
      await repo.delete({ store_id: storeId, status: 'suggested' });
    }

    // 拉现有员工列表
    const staff: Array<{ id: number; store_id: number }> = await this.opsConnection.query(
      `SELECT id, store_id FROM ops_staff WHERE deputy_id IS NOT NULL ${storeId ? `AND store_id = ${storeId}` : ''} LIMIT 30`,
    ).catch(() => []);

    let staffIdx = 0;
    const drafts: Partial<ScheduleDraft>[] = [];

    for (const day of staffingDays) {
      for (const shift of day.shifts) {
        for (let i = 0; i < shift.staffCount; i++) {
          if (!staff.length) break;
          const s = staff[staffIdx % staff.length];
          drafts.push({
            forecast_run_id: runId,
            store_id: storeId ?? s.store_id,
            staff_id: s.id,
            shift_date: day.date,
            shift_start: shift.start,
            shift_end: shift.end,
            role: shift.role,
            status: 'suggested',
          });
          staffIdx++;
        }
      }
    }

    if (drafts.length) await repo.save(repo.create(drafts as any));
  }

  private async savePurchaseDrafts(runId: number, storeId: number, suggestions: any[]): Promise<void> {
    const repo = this.opsConnection.getRepository(PurchaseDraft);
    if (storeId) await repo.delete({ store_id: storeId, status: 'suggested' });

    const drafts = suggestions
      .filter(s => s.needsOrder && s.suggestedOrderQty > 0)
      .map(s => repo.create({
        forecast_run_id: runId,
        store_id: storeId ?? 0,
        product_name: s.productName,
        sku_code: s.skuCode,
        suggested_qty: s.suggestedOrderQty,
        unit: s.unit,
        current_stock: s.currentStock,
        lead_time_days: s.leadTimeDays,
        status: 'suggested',
      }));

    if (drafts.length) await repo.save(drafts);
  }
}
