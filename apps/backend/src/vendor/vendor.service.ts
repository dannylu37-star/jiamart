import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { Vendor } from './entities/vendor.entity';
import { VendorProduct } from './entities/vendor-product.entity';

@Injectable()
export class VendorService {
  constructor(@InjectConnection('ops') private readonly opsConnection: Connection) {}

  async findAll(page = 1, limit = 20): Promise<{ data: Vendor[]; total: number }> {
    const repo = this.opsConnection.getRepository(Vendor);
    const [data, total] = await repo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { created_at: 'DESC' },
    });
    return { data, total };
  }

  async findOne(id: number): Promise<Vendor> {
    const repo = this.opsConnection.getRepository(Vendor);
    const vendor = await repo.findOne({ where: { id }, relations: ['products', 'forms'] });
    if (!vendor) throw new NotFoundException(`Vendor ${id} not found`);
    return vendor;
  }

  async create(dto: Partial<Vendor>): Promise<Vendor> {
    const repo = this.opsConnection.getRepository(Vendor);
    return repo.save(repo.create(dto));
  }

  async update(id: number, dto: Partial<Vendor>): Promise<Vendor> {
    const repo = this.opsConnection.getRepository(Vendor);
    await repo.update(id, dto);
    return this.findOne(id);
  }

  async addProduct(vendorId: number, dto: Partial<VendorProduct>): Promise<VendorProduct> {
    const prodRepo = this.opsConnection.getRepository(VendorProduct);
    return prodRepo.save(prodRepo.create({ vendor_id: vendorId, ...dto }));
  }

  async updateProduct(vendorId: number, productId: number, dto: Partial<VendorProduct>): Promise<VendorProduct> {
    const prodRepo = this.opsConnection.getRepository(VendorProduct);
    await prodRepo.update({ id: productId, vendor_id: vendorId }, dto);
    return prodRepo.findOne({ where: { id: productId } }) as any;
  }
}
