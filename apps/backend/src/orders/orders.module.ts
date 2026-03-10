import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderEntity } from '../entities/order.entity';
import { OrderDetailEntity } from '../entities/order-detail.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity, OrderDetailEntity])],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
