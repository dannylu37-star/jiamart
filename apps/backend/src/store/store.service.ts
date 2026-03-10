import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StoreEntity } from '../entities/store.entity';

@Injectable()
export class StoreService {
  constructor(@InjectRepository(StoreEntity, 'ops') private repo: Repository<StoreEntity>) {}
  findAll() { return this.repo.find({ order: { id: 'ASC' } }); }
  findOne(id: number) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<StoreEntity>) { return this.repo.save(this.repo.create(data)); }
  async update(id: number, data: Partial<StoreEntity>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.repo.update(id, { status: false });
    return { success: true };
  }
}
