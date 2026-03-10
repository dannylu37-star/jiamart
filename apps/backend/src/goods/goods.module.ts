import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoodsController } from './goods.controller';
import { GoodsService } from './goods.service';
import { GoodsEntity } from '../entities/goods.entity';
import { CategoryEntity } from '../entities/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GoodsEntity, CategoryEntity])],
  controllers: [GoodsController],
  providers: [GoodsService],
  exports: [GoodsService],
})
export class GoodsModule {}
