import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoodsEntity } from '../entities/goods.entity';

@Injectable()
export class GoodsService {
  constructor(@InjectRepository(GoodsEntity) private repo: Repository<GoodsEntity>) {}

  findAll(page = 1, limit = 50, search?: string, statusFilter?: string, businessLine?: string) {
    const qb = this.repo.createQueryBuilder('g')
      .leftJoinAndSelect('g.category', 'category')
      .orderBy('g.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (statusFilter === 'on') qb.andWhere('g.status = true');
    else if (statusFilter === 'off') qb.andWhere('g.status = false');
    // default: show all

    if (search) {
      qb.andWhere('(g.name LIKE :s OR g.en_name LIKE :s OR g.hide_code LIKE :s)', { s: `%${search}%` });
    }

    if (businessLine && businessLine !== 'all') {
      // Business line filter by category parent or keyword
      qb.andWhere('(category.name LIKE :bl OR g.name LIKE :bl)', { bl: `%${businessLine}%` });
    }

    return qb.getManyAndCount();
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id }, relations: ['category'] });
  }

  create(data: Partial<GoodsEntity>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<GoodsEntity>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.repo.update(id, { status: false });
    return { success: true };
  }
}
