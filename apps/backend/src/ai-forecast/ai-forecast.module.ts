import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForecastRun } from './entities/forecast-run.entity';
import { ScheduleDraft } from './entities/schedule-draft.entity';
import { PurchaseDraft } from './entities/purchase-draft.entity';
import { SkuConfig } from './entities/sku-config.entity';
import { StaffingForecastService } from './staffing-forecast.service';
import { SalesForecastService } from './sales-forecast.service';
import { InventoryForecastService } from './inventory-forecast.service';
import { AiForecastService } from './ai-forecast.service';
import { AiForecastController } from './ai-forecast.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [ForecastRun, ScheduleDraft, PurchaseDraft, SkuConfig],
      'ops',
    ),
  ],
  providers: [
    StaffingForecastService,
    SalesForecastService,
    InventoryForecastService,
    AiForecastService,
  ],
  controllers: [AiForecastController],
  exports: [AiForecastService],
})
export class AiForecastModule {}
