import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { OpsStaffEntity } from '../entities/ops-staff.entity';
import { OpsShiftEntity } from '../entities/ops-shift.entity';
import { OpsAttendanceEntity } from '../entities/ops-attendance.entity';
import { OpsPayrollEntity } from '../entities/ops-payroll.entity';
import { StoreEntity } from '../entities/store.entity';
import { GoogleCalendarService } from './google-calendar.service';

export type RequestUser = { id: number; role: string; storeId?: number; staffId?: number };

@Injectable()
export class OpsService {
  constructor(
    @InjectRepository(OpsStaffEntity, 'ops') private staffRepo: Repository<OpsStaffEntity>,
    @InjectRepository(OpsShiftEntity, 'ops') private shiftRepo: Repository<OpsShiftEntity>,
    @InjectRepository(OpsAttendanceEntity, 'ops') private attRepo: Repository<OpsAttendanceEntity>,
    @InjectRepository(OpsPayrollEntity, 'ops') private payrollRepo: Repository<OpsPayrollEntity>,
    @InjectRepository(StoreEntity, 'ops') private storeRepo: Repository<StoreEntity>,
    private calendarSvc: GoogleCalendarService,
  ) {}

  // ── Lookup ──
  getStoresList() {
    return this.storeRepo.find({ where: { status: true }, order: { name: 'ASC' }, select: ['id', 'name'] });
  }

  getRoles() {
    return [
      { value: 'superadmin', label: '超级管理员' },
      { value: 'admin',      label: '管理员' },
      { value: 'manager',    label: '店长' },
      { value: 'employee',   label: '员工' },
    ];
  }

  // ── Staff ──
  findAllStaff(user: RequestUser, statusFilter?: string) {
    const statusWhere = statusFilter && statusFilter !== 'all' ? { status: statusFilter } : {};
    if (user.role === 'admin') return this.staffRepo.find({ where: { ...statusWhere }, order: { name: 'ASC' } });
    if (user.role === 'manager' && user.storeId)
      return this.staffRepo.find({ where: { storeId: user.storeId, ...statusWhere }, order: { name: 'ASC' } });
    if (user.staffId) return this.staffRepo.find({ where: { id: user.staffId } });
    return [];
  }

  // ── Checklist ──
  async getChecklistSummary(user: RequestUser) {
    const staff = await this.findAllStaff(user);
    if (!staff.length) return [];
    const staffIds = (staff as any[]).map((s: any) => s.id);
    const rows = await this.storeRepo.manager.query(
      `SELECT staff_id, status, COUNT(*) as cnt FROM jiamart_ops.ops_onboarding_checklist WHERE staff_id IN (?) GROUP BY staff_id, status`,
      [staffIds]
    );
    const storeMap = await this.storeRepo.find({ select: ['id', 'name'] }).then(ss => Object.fromEntries(ss.map(s => [s.id, s.name])));
    const summary: any[] = (staff as any[]).map((s: any) => {
      const items = rows.filter((r: any) => +r.staff_id === s.id);
      const total = items.reduce((a: number, r: any) => a + +r.cnt, 0);
      const verified = items.filter((r: any) => r.status === 'verified').reduce((a: number, r: any) => a + +r.cnt, 0);
      return { staffId: s.id, name: s.name, storeId: s.storeId, storeName: storeMap[s.storeId] || '未分配', total, verified };
    });
    return summary;
  }

  async getChecklistDetail(staffId: number) {
    const rows = await this.storeRepo.manager.query(
      `SELECT id, item as itemName, status, doc_url as docUrl, notes, verified_at as verifiedAt FROM jiamart_ops.ops_onboarding_checklist WHERE staff_id = ? ORDER BY item`,
      [staffId]
    );
    return rows;
  }

  async updateChecklistItem(itemId: number, data: { status?: string; docUrl?: string; notes?: string }, user: RequestUser) {
    const sets: string[] = [];
    const params: any[] = [];
    if (data.status) { sets.push('status = ?'); params.push(data.status); }
    if (data.docUrl !== undefined) { sets.push('doc_url = ?'); params.push(data.docUrl); }
    if (data.notes !== undefined) { sets.push('notes = ?'); params.push(data.notes); }
    if (data.status === 'verified') {
      sets.push('verified_by = ?', 'verified_at = NOW()');
      params.push(user.id);
    }
    if (!sets.length) return { success: true };
    params.push(itemId);
    await this.storeRepo.manager.query(
      `UPDATE jiamart_ops.ops_onboarding_checklist SET ${sets.join(', ')} WHERE id = ?`,
      params
    );
    return { success: true };
  }

  findStaff(id: number, user: RequestUser) {
    this.assertStaffAccess(id, user);
    return this.staffRepo.findOne({ where: { id } });
  }

  createStaff(data: Partial<OpsStaffEntity>, user: RequestUser) {
    if (!['admin', 'manager'].includes(user.role)) throw new ForbiddenException('权限不足');
    return this.staffRepo.save(this.staffRepo.create(data));
  }

  async updateStaff(id: number, data: Partial<OpsStaffEntity>, user: RequestUser) {
    if (!['admin', 'manager'].includes(user.role)) throw new ForbiddenException('权限不足');
    await this.staffRepo.update(id, data);
    return this.staffRepo.findOne({ where: { id } });
  }

  // ── Shifts ──
  getShifts(startDate: string, endDate: string, user: RequestUser, storeId?: number) {
    const where: any = { shiftDate: Between(startDate, endDate) };

    if (user.role === 'staff') {
      // 员工只能看自己的排班
      where.staffId = user.staffId;
    } else if (user.role === 'manager') {
      // 店长看本店，但允许指定门店时做校验
      where.storeId = storeId && storeId === user.storeId ? storeId : user.storeId;
    } else if (user.role === 'admin') {
      if (storeId) where.storeId = storeId;
    }

    return this.shiftRepo.find({ where, relations: ['staff'], order: { shiftDate: 'ASC', startTime: 'ASC' } });
  }

  async createShift(data: Partial<OpsShiftEntity>, user: RequestUser) {
    if (!['admin', 'manager'].includes(user.role)) throw new ForbiddenException('权限不足');
    const shift = await this.shiftRepo.save(this.shiftRepo.create(data));

    // 异步推送 Google Calendar（不阻断响应）
    this.pushShiftToCalendar(shift).catch(() => {});

    return shift;
  }

  async updateShift(id: number, data: Partial<OpsShiftEntity>, user: RequestUser) {
    if (!['admin', 'manager'].includes(user.role)) throw new ForbiddenException('权限不足');
    await this.shiftRepo.update(id, data);
    const shift = await this.shiftRepo.findOne({ where: { id }, relations: ['staff'] });

    // 如果取消排班，删除日历事件
    if (data.status === 'cancelled' && (shift as any)?.calendarEventId) {
      this.calendarSvc.deleteShiftEvent((shift as any).calendarEventId).catch(() => {});
    }
    return shift;
  }

  private async pushShiftToCalendar(shift: OpsShiftEntity) {
    const staff = await this.staffRepo.findOne({ where: { id: shift.staffId } });
    if (!staff?.email) return;
    await this.calendarSvc.createShiftEvent(staff.email, {
      shiftDate: shift.shiftDate,
      startTime: shift.startTime,
      endTime: shift.endTime,
      notes: shift.notes ?? undefined,
    });
  }

  // ── Attendance ──
  clockIn(staffId: number, shiftId: number, lat: number, lng: number, photoUrl?: string) {
    return this.attRepo.save(this.attRepo.create({
      staffId, shiftId, clockIn: new Date(), clockInLat: lat, clockInLng: lng, photoUrl, status: 'normal',
    }));
  }

  async clockOut(id: number) {
    const rec = await this.attRepo.findOne({ where: { id } });
    if (!rec) return null;
    const clockOut = new Date();
    const workedMinutes = Math.floor((clockOut.getTime() - rec.clockIn!.getTime()) / 60000);
    await this.attRepo.update(id, { clockOut, workedMinutes });
    return this.attRepo.findOne({ where: { id } });
  }

  async getAttendance(user: RequestUser, staffId?: number, date?: string) {
    // attendance.staff_id stores Deputy ID, join via ops_staff.deputy_id
    const conditions: string[] = [];
    const params: any[] = [];

    if (date) {
      conditions.push('DATE(a.clock_in) = ?');
      params.push(date);
    }
    if (staffId) {
      conditions.push('s.id = ?');
      params.push(staffId);
    }
    if (user.role === 'manager' && user.storeId) {
      conditions.push('s.store_id = ?');
      params.push(user.storeId);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const rows = await this.attRepo.manager.query(`
      SELECT
        a.id, a.staff_id, a.clock_in, a.clock_out, a.worked_minutes, a.status,
        a.photo_url,
        s.id        AS staffDbId,
        s.name      AS staffName,
        s.store_id  AS storeId,
        st.name     AS storeName
      FROM jiamart_ops.ops_attendance a
      LEFT JOIN jiamart_ops.ops_staff s ON s.deputy_id = CAST(a.staff_id AS CHAR)
      LEFT JOIN jiamart_ops.ops_store st ON s.store_id = st.id
      ${where}
      ORDER BY a.clock_in DESC
      LIMIT 300
    `, params);

    return rows.map((r: any) => ({
      id:           r.id,
      staffId:      r.staff_id,
      staffName:    r.staffName || null,
      storeName:    r.storeName || null,
      clockIn:      r.clock_in,
      clockOut:     r.clock_out,
      workedMinutes: r.worked_minutes,
      status:       r.status,
      photoUrl:     r.photo_url,
    }));
  }

  // ── Payroll ──
  async getPayroll(periodStart: string, periodEnd: string, user: RequestUser) {
    if (!['admin', 'manager'].includes(user.role)) throw new ForbiddenException('权限不足');

    // manager 通过 JOIN staff.store_id 过滤本店员工工资
    if (user.role === 'manager' && user.storeId) {
      const rows = await this.payrollRepo.manager.query(`
        SELECT p.*, s.name AS staffName, s.store_id AS storeId
        FROM jiamart_ops.ops_payroll p
        JOIN jiamart_ops.ops_staff s ON s.id = p.staff_id
        WHERE p.period_start = ? AND p.period_end = ? AND s.store_id = ?
        ORDER BY p.staff_id ASC
      `, [periodStart, periodEnd, user.storeId]);
      return rows;
    }

    return this.payrollRepo.find({
      where: { periodStart, periodEnd },
      relations: ['staff'],
      order: { staffId: 'ASC' },
    });
  }

  createPayroll(data: Partial<OpsPayrollEntity>, user: RequestUser) {
    if (user.role !== 'admin') throw new ForbiddenException('仅管理员可操作薪资');
    return this.payrollRepo.save(this.payrollRepo.create(data));
  }

  async approvePayroll(id: number, user: RequestUser) {
    if (!['admin', 'manager'].includes(user.role)) throw new ForbiddenException('权限不足');
    await this.payrollRepo.update(id, { status: 'approved' });
    return this.payrollRepo.findOne({ where: { id } });
  }

  async markPaid(id: number, user: RequestUser) {
    if (user.role !== 'admin') throw new ForbiddenException('仅管理员可标记已付');
    await this.payrollRepo.update(id, { status: 'paid', paidAt: new Date() });
    return this.payrollRepo.findOne({ where: { id } });
  }

  // ── Helper ──
  private assertStaffAccess(targetStaffId: number, user: RequestUser) {
    if (user.role === 'admin') return;
    if (user.role === 'manager') return; // 店长可查所有（后续可限制本店）
    if (user.staffId !== targetStaffId) throw new ForbiddenException('只能查看自己的档案');
  }
}
