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
      const goods: Array<{ id: number; name: string; en_name: string }> =
        await this.opsConnection.query(`
          SELECT id, COALESCE(name, en_name, CONCAT('SKU-',id)) AS name, en_name
          FROM jiamart_shop.sp_goods_s1
          LIMIT 500
        `).catch(() => []);

      skuList = goods.map(g => ({
        id: 0,
        store_id: storeId ?? null,
        sku_code: String(g.id),
        product_name: g.name || g.en_name,
        lead_time_days: 3,
        safety_stock_days: 2,
        avg_daily_usage: null,
      })) as any[];
    }

    // 3. 对每个 SKU 计算日均用量（从过去 30 天销售推算）
    // 用真实 EPOS 订单明细计算日均销量（优先用 Burleigh Street 数据）
    const salesBySkuRaw: Array<{ sku_no: string; total_qty: string }> =
      await this.opsConnection.query(`
        SELECT 
          d.product_id AS sku_no,
          SUM(d.numbers) / 30 AS total_qty
        FROM jiamart_shop.sp_epos_order_details_s1 d
        JOIN jiamart_shop.sp_epos_order_s1 o ON o.id = d.epos_id
        WHERE FROM_UNIXTIME(o.pay_time) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
          AND d.chinese_name != 'item'
        GROUP BY d.product_id
      `).catch(() => []);

    const skuSalesMap: Record<string, number> = {};
    for (const s of salesBySkuRaw) {
      skuSalesMap[s.sku_no] = parseFloat(s.total_qty) / 30;
    }

    // 4. 拉当前库存（sp_goods.stock）
    const stockRaw: Array<{ id: number; stock: number }> =
      await this.opsConnection.query(`
        SELECT id, stock FROM jiamart_shop.sp_goods_s1
      `).catch(() => []);
    const stockMap: Record<string, number> = {};
    for (const s of stockRaw) stockMap[String(s.id)] = s.stock ?? 0;

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
