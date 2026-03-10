import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vendor } from './entities/vendor.entity';
import { VendorProduct } from './entities/vendor-product.entity';
import { VendorOrderForm } from './entities/vendor-order-form.entity';
import { VendorService } from './vendor.service';
import { VendorFormService } from './vendor-form.service';
import { VendorController } from './vendor.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Vendor, VendorProduct, VendorOrderForm], 'ops')],
  providers: [VendorService, VendorFormService],
  controllers: [VendorController],
})
export class VendorModule {}
