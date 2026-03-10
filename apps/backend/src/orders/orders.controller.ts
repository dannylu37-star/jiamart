import { Controller, Get, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private svc: OrdersService) {}

  @Get()
  findAll(@Query('page') page = 1, @Query('limit') limit = 20, @Query('status') status?: string) {
    return this.svc.findAll(+page, +limit, status);
  }

  @Get('summary')
  summary(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.svc.summary(dateFrom, dateTo);
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(+id); }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.svc.updateStatus(+id, status);
  }
}
