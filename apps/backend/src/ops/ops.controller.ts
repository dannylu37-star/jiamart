import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { OpsService, RequestUser } from './ops.service';

@Controller('ops')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OpsController {
  constructor(private svc: OpsService) {}

  private u(req: any): RequestUser {
    return req.user as RequestUser;
  }

  // ── Lookup ──
  @Get('stores-list')
  getStoresList() { return this.svc.getStoresList(); }

  @Get('roles')
  getRoles() { return this.svc.getRoles(); }

  // ── Staff ──
  @Get('staff')
  getStaff(@Req() req: any, @Query('status') status?: string) { return this.svc.findAllStaff(this.u(req), status); }

  @Get('checklist')
  getChecklist(@Req() req: any) { return this.svc.getChecklistSummary(this.u(req)); }

  @Get('checklist/:staffId')
  getChecklistDetail(@Param('staffId') staffId: string) { return this.svc.getChecklistDetail(+staffId); }

  @Put('checklist/item/:itemId')
  @Roles('admin', 'manager')
  updateChecklistItem(
    @Param('itemId') itemId: string,
    @Body() body: { status?: string; docUrl?: string; notes?: string },
    @Req() req: any,
  ) { return this.svc.updateChecklistItem(+itemId, body, this.u(req)); }

  @Get('staff/:id')
  getOne(@Param('id') id: string, @Req() req: any) { return this.svc.findStaff(+id, this.u(req)); }

  @Post('staff')
  @Roles('admin', 'manager')
  createStaff(@Body() body: any, @Req() req: any) { return this.svc.createStaff(body, this.u(req)); }

  @Put('staff/:id')
  @Roles('admin', 'manager')
  updateStaff(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.updateStaff(+id, body, this.u(req));
  }

  // ── Shifts ──
  @Get('shifts')
  getShifts(
    @Req() req: any,
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('store') storeId?: string,
  ) {
    return this.svc.getShifts(start, end, this.u(req), storeId ? +storeId : undefined);
  }

  @Post('shifts')
  @Roles('admin', 'manager')
  createShift(@Body() body: any, @Req() req: any) { return this.svc.createShift(body, this.u(req)); }

  @Put('shifts/:id')
  @Roles('admin', 'manager')
  updateShift(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.svc.updateShift(+id, body, this.u(req));
  }

  // ── Attendance ──
  @Get('attendance')
  getAttendance(
    @Req() req: any,
    @Query('staffId') staffId?: string,
    @Query('date') date?: string,
  ) {
    return this.svc.getAttendance(this.u(req), staffId ? +staffId : undefined, date);
  }

  @Post('attendance/clock-in')
  clockIn(@Body() b: { staffId: number; shiftId: number; lat: number; lng: number; photoUrl?: string }) {
    return this.svc.clockIn(b.staffId, b.shiftId, b.lat, b.lng, b.photoUrl);
  }

  @Put('attendance/:id/clock-out')
  clockOut(@Param('id') id: string) { return this.svc.clockOut(+id); }

  // ── Payroll ──
  @Get('payroll')
  @Roles('admin', 'manager')
  getPayroll(
    @Req() req: any,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    return this.svc.getPayroll(start, end, this.u(req));
  }

  @Post('payroll')
  @Roles('admin')
  createPayroll(@Body() body: any, @Req() req: any) { return this.svc.createPayroll(body, this.u(req)); }

  @Put('payroll/:id/approve')
  @Roles('admin', 'manager')
  approvePayroll(@Param('id') id: string, @Req() req: any) { return this.svc.approvePayroll(+id, this.u(req)); }

  @Put('payroll/:id/paid')
  @Roles('admin')
  markPaid(@Param('id') id: string, @Req() req: any) { return this.svc.markPaid(+id, this.u(req)); }
}
