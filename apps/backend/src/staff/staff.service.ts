import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffEntity } from '../entities/staff.entity';

@Injectable()
export class StaffService {
  constructor(@InjectRepository(StaffEntity) private repo: Repository<StaffEntity>) {}
  findAll() { return this.repo.find({ order: { id: 'ASC' } }); }
  findOne(id: number) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<StaffEntity>) { return this.repo.save(this.repo.create(data)); }
  async update(id: number, data: Partial<StaffEntity>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }
  async deactivate(id: number) {
    await this.repo.update(id, { status: false });
    return { success: true };
  }
}
