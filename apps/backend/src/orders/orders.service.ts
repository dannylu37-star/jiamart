import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(@InjectRepository(OrderEntity) private repo: Repository<OrderEntity>) {}

  findAll(page = 1, limit = 20, status?: string) {
    const where: any = {};
    if (status) where.status = status;
    return this.repo.findAndCount({
      where,
      relations: ['user', 'details'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id }, relations: ['user', 'details', 'details.goods'] });
  }

  async updateStatus(id: number, status: string) {
    await this.repo.update(id, { status });
    return this.findOne(id);
  }

  // KPI summary — returns { totals, payBreakdown, dailyTrend }
  async summary(dateFrom?: string, dateTo?: string) {
    const qb = () => this.repo.createQueryBuilder('o').where("o.payment_status = 'paid'");
    const addDate = (q: any) => {
      if (dateFrom) q.andWhere('DATE(o.created_at) >= :df', { df: dateFrom });
      if (dateTo)   q.andWhere('DATE(o.created_at) <= :dt', { dt: dateTo });
      return q;
    };

    const [totalsRaw, payRaw, trendRaw] = await Promise.all([
      addDate(qb())
        .select('COUNT(*)', 'orderCount')
        .addSelect('COALESCE(SUM(o.now_money),0)', 'totalRevenue')
        .addSelect('COALESCE(AVG(o.now_money),0)', 'avgOrder')
        .getRawOne(),
      addDate(qb())
        .select('o.pay_method', 'payMethod')
        .addSelect('COUNT(*)', 'count')
        .addSelect('SUM(o.now_money)', 'total')
        .groupBy('o.pay_method')
        .getRawMany(),
      addDate(qb())
        .select('DATE(o.created_at)', 'date')
        .addSelect('COUNT(*)', 'orderCount')
        .addSelect('SUM(o.now_money)', 'revenue')
        .groupBy('DATE(o.created_at)')
        .orderBy('date', 'DESC')
        .limit(30)
        .getRawMany(),
    ]);

    return {
      totals: {
        totalRevenue: parseFloat(totalsRaw?.totalRevenue || 0).toFixed(2),
        orderCount:   parseInt(totalsRaw?.orderCount || 0),
        avgOrder:     parseFloat(totalsRaw?.avgOrder || 0).toFixed(2),
      },
      payBreakdown: payRaw.map(r => ({ payMethod: r.payMethod || '其他', count: +r.count, total: parseFloat(r.total || 0) })),
      dailyTrend:   trendRaw.map(r => ({ date: r.date, orderCount: +r.orderCount, revenue: parseFloat(r.revenue || 0) })),
    };
  }
}
