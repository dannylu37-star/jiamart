import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockEntity } from '../entities/stock.entity';

@Injectable()
export class StockService {
  constructor(@InjectRepository(StockEntity) private repo: Repository<StockEntity>) {}

  findAll() { return this.repo.find({ relations: ['goods'] }); }

  findLow(threshold = 10) {
    return this.repo.createQueryBuilder('s')
      .where('s.num <= :threshold', { threshold })
      .leftJoinAndSelect('s.goods', 'g')
      .getMany();
  }

  async adjust(goodsId: number, delta: number, reason: string) {
    let stock = await this.repo.findOne({ where: { goodsId } });
    if (!stock) {
      stock = this.repo.create({ goodsId, num: 0, oldNum: 0, reason });
    }
    stock.oldNum = stock.num;
    stock.num = stock.num + delta;
    stock.reason = reason;
    return this.repo.save(stock);
  }
}
