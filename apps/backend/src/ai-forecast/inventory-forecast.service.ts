import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { SkuConfig } from './entities/sku-config.entity';

export interface InventorySuggestion {
  skuCode: string;
  productName: string;
  currentStock: number | null;
  avgDailyUsage: number;
  leadTimeDays: number;
  safetyStockDays: number;
  reorderPoint: number;
  suggestedOrderQty: number;
  unit: string;
  needsOrder: boolean;
}

@Injectable()
export class InventoryForecastService {
  private readonly logger = new Logger(InventoryForecastService.name);

  constructor(@InjectConnection('ops') private readonly opsConnection: Connection) {}

  async forecast(storeId?: number): Promise<InventorySuggestion[]> {
    // 1. 拉 sku_config（已配置 lead_time / safety_stock）
    const skuRepo = this.opsConnection.getRepository(SkuConfig);
    const storeFilter = storeId ? { store_id: storeId } : {};
    const configs = await skuRepo.find({ where: storeFilter as any });

    // 2. 如果没有手动配置，从 sp_goods 读商品列表兜底
    let skuList = configs;
    if (!skuList.length) {
      const goods: Array<{ sku_no: string; goods_name: string; stock: string }> =
        await this.opsConnection.query(`
          SELECT sku_no, goods_name, stock
          FROM jiamart_shop.sp_goods
          WHERE is_on_sale = 1
          LIMIT 200
        `).catch(() => []);

      skuList = goods.map(g => ({
        id: 0,
        store_id: storeId ?? null,
        sku_code: g.sku_no,
        product_name: g.goods_name,
        lead_time_days: 3,
        safety_stock_days: 2,
        avg_daily_usage: null,
      })) as any[];
    }

    // 3. 对每个 SKU 计算日均用量（从过去 30 天销售推算）
    const salesBySkuRaw: Array<{ sku_no: string; total_qty: string }> =
      await this.opsConnection.query(`
        SELECT oi.sku_no, SUM(oi.goods_num) AS total_qty
        FROM jiamart_shop.sp_order_goods oi
        JOIN jiamart_shop.sp_order o ON o.order_id = oi.order_id
        WHERE o.payment_status = 'succeeded'
          AND o.created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY oi.sku_no
      `).catch(() => []);

    const skuSalesMap: Record<string, number> = {};
    for (const s of salesBySkuRaw) {
      skuSalesMap[s.sku_no] = parseFloat(s.total_qty) / 30;
    }

    // 4. 拉当前库存（sp_goods.stock）
    const stockRaw: Array<{ sku_no: string; stock: string }> =
      await this.opsConnection.query(`
        SELECT sku_no, stock FROM jiamart_shop.sp_goods
      `).catch(() => []);
    const stockMap: Record<string, number> = {};
    for (const s of stockRaw) stockMap[s.sku_no] = parseFloat(s.stock) || 0;

    // 5. 计算 reorder point + suggested qty
    return skuList.map(sku => {
      const dailyUsage = sku.avg_daily_usage ?? skuSalesMap[sku.sku_code] ?? 0;
      const leadTime = sku.lead_time_days ?? 3;
      const safetyDays = sku.safety_stock_days ?? 2;
      const currentStock = stockMap[sku.sku_code] ?? null;

      const reorderPoint = dailyUsage * (leadTime + safetyDays);
      const suggestedQty = currentStock !== null
        ? Math.max(0, reorderPoint - currentStock)
        : reorderPoint;

      return {
        skuCode: sku.sku_code,
        productName: sku.product_name,
        currentStock,
        avgDailyUsage: Math.round(dailyUsage * 100) / 100,
        leadTimeDays: leadTime,
        safetyStockDays: safetyDays,
        reorderPoint: Math.round(reorderPoint * 100) / 100,
        suggestedOrderQty: Math.round(suggestedQty * 100) / 100,
        unit: '件',
        needsOrder: suggestedQty > 0,
      };
    }).filter(s => s.avgDailyUsage > 0 || s.suggestedOrderQty > 0);
  }
}
