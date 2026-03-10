import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { OpsController } from './ops.controller';
import { OpsService } from './ops.service';
import { GoogleCalendarService } from './google-calendar.service';
import { OpsStaffEntity } from '../entities/ops-staff.entity';
import { OpsShiftEntity } from '../entities/ops-shift.entity';
import { OpsAttendanceEntity } from '../entities/ops-attendance.entity';
import { OpsPayrollEntity } from '../entities/ops-payroll.entity';
import { StoreEntity } from '../entities/store.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([OpsStaffEntity, OpsShiftEntity, OpsAttendanceEntity, OpsPayrollEntity, StoreEntity], 'ops'),
  ],
  controllers: [OpsController],
  providers: [OpsService, GoogleCalendarService],
  exports: [OpsService, GoogleCalendarService],
})
export class OpsModule {}
