import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StockService } from './stock.service';

@Controller('stock')
@UseGuards(JwtAuthGuard)
export class StockController {
  constructor(private svc: StockService) {}

  @Get() findAll() { return this.svc.findAll(); }
  @Get('low') findLow(@Query('threshold') t = 10) { return this.svc.findLow(+t); }

  @Post('adjust')
  adjust(@Body() body: { goodsId: number; delta: number; reason: string }) {
    return this.svc.adjust(body.goodsId, body.delta, body.reason);
  }
}
