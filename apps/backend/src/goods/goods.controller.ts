import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { GoodsService } from './goods.service';

@Controller('goods')
@UseGuards(JwtAuthGuard)
export class GoodsController {
  constructor(private svc: GoodsService) {}

  @Get()
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('businessLine') businessLine?: string,
  ) {
    return this.svc.findAll(+page, +limit, search, status, businessLine);
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(+id); }

  @Post()
  create(@Body() body: any) { return this.svc.create(body); }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.svc.update(+id, body); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.svc.remove(+id); }
}
