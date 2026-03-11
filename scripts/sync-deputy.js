#!/usr/bin/env node
/**
 * Deputy → Jiamart 数据同步脚本
 * 同步：员工、排班、考勤、门店
 */

const mysql = require('mysql2/promise');

const DEPUTY_SUBDOMAIN = process.env.DEPUTY_SUBDOMAIN || '308b7a11014810.uk';
const DEPUTY_TOKEN = process.env.DEPUTY_TOKEN || '28c9d283a4af95dc7f6ded9fb48fe989';
const DEPUTY_BASE = `https://${DEPUTY_SUBDOMAIN}.deputy.com/api/v1`;

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'jiamart',
  password: process.env.DB_PASSWORD || 'jiamart_dev_2026',
  database: 'jiamart_ops',
};

async function deputyFetch(endpoint) {
  const res = await fetch(`${DEPUTY_BASE}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${DEPUTY_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Deputy API error: ${res.status} ${res.statusText}`);
  return res.json();
}

async function syncEmployees(conn) {
  console.log('\n📋 同步员工...');
  const employees = await deputyFetch('/resource/Employee');
  console.log(`   获取 ${employees.length} 个员工`);

  let inserted = 0, updated = 0;
  for (const e of employees) {
    const [existing] = await conn.query(
      'SELECT id FROM ops_staff WHERE deputy_id = ?',
      [e.Id]
    );
    
    const data = {
      deputy_id: String(e.Id),
      name: e.DisplayName || `${e.FirstName || ''} ${e.LastName || ''}`.trim(),
      email: e.Email || null,
      mobile: e.Mobile || e.Phone || null,
      position: e.Role === 1 ? 'manager' : 'staff',
      status: e.Active ? 'active' : 'inactive',
      store_id: e.Company || 1,
      hire_date: e.StartDate && e.StartDate > 0 ? new Date(e.StartDate * 1000).toISOString().split('T')[0] : null,
    };

    if (existing.length > 0) {
      await conn.query(
        `UPDATE ops_staff SET name=?, email=?, mobile=?, position=?, status=?, store_id=?, hire_date=?, updated_at=NOW()
         WHERE deputy_id=?`,
        [data.name, data.email, data.mobile, data.position, data.status, data.store_id, data.hire_date, data.deputy_id]
      );
      updated++;
    } else {
      await conn.query(
        `INSERT INTO ops_staff (deputy_id, name, email, mobile, position, status, store_id, hire_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [data.deputy_id, data.name, data.email, data.mobile, data.position, data.status, data.store_id, data.hire_date]
      );
      inserted++;
    }
  }
  console.log(`   ✅ 新增 ${inserted}, 更新 ${updated}`);
  return employees.length;
}

async function syncRosters(conn) {
  console.log('\n📅 同步排班...');
  
  // 使用 supervise/roster 端点获取排班
  const rosters = await deputyFetch('/supervise/roster');
  console.log(`   获取 ${rosters.length} 条排班记录`);

  // 清理旧数据后重新插入
  await conn.query('DELETE FROM ops_shift WHERE deputy_id IS NOT NULL');
  
  let inserted = 0;
  for (const r of rosters) {
    if (!r.Employee) continue; // 跳过未分配的排班
    
    const startTime = new Date(r.StartTime * 1000);
    const endTime = new Date(r.EndTime * 1000);
    
    await conn.query(
      `INSERT INTO ops_shift (deputy_id, staff_id, store_id, shift_date, start_time, end_time, status, created_at)
       SELECT ?, s.id, ?, ?, ?, ?, ?, NOW()
       FROM ops_staff s WHERE s.deputy_id = ?`,
      [
        r.Id,
        r.Company || 1,
        startTime.toISOString().split('T')[0],
        startTime.toTimeString().slice(0, 8),
        endTime.toTimeString().slice(0, 8),
        r.ConfirmStatus === 1 ? 'confirmed' : 'pending',
        r.Employee,
      ]
    );
    inserted++;
  }
  console.log(`   ✅ 插入 ${inserted} 条排班`);
  return inserted;
}

async function syncTimesheets(conn) {
  console.log('\n⏱️  同步考勤...');
  
  // 使用 supervise/timesheet 端点获取考勤
  const timesheets = await deputyFetch('/supervise/timesheet');
  console.log(`   获取 ${timesheets.length} 条考勤记录`);

  // 清理旧数据后重新插入
  await conn.query('DELETE FROM ops_attendance WHERE deputy_id IS NOT NULL');

  let inserted = 0;
  for (const t of timesheets) {
    if (!t.Employee) continue;
    
    const clockIn = new Date(t.StartTime * 1000);
    const clockOut = t.EndTime ? new Date(t.EndTime * 1000) : null;
    const workedMinutes = t.TotalTime ? Math.round(t.TotalTime * 60) : null;
    
    await conn.query(
      `INSERT INTO ops_attendance (deputy_id, staff_id, clock_in, clock_out, worked_minutes, status, created_at)
       SELECT ?, s.id, ?, ?, ?, ?, NOW()
       FROM ops_staff s WHERE s.deputy_id = ?`,
      [
        t.Id,
        clockIn.toISOString().slice(0, 19).replace('T', ' '),
        clockOut ? clockOut.toISOString().slice(0, 19).replace('T', ' ') : null,
        workedMinutes,
        t.IsApproved ? 'approved' : 'normal',
        String(t.Employee),
      ]
    );
    inserted++;
  }
  console.log(`   ✅ 插入 ${inserted} 条考勤`);
  return inserted;
}

async function syncLocations(conn) {
  console.log('\n🏪 同步门店...');
  const companies = await deputyFetch('/resource/Company');
  console.log(`   获取 ${companies.length} 个门店/公司`);

  for (const c of companies) {
    const [existing] = await conn.query(
      'SELECT id FROM ops_store WHERE deputy_id = ?',
      [c.Id]
    );

    if (existing.length === 0) {
      await conn.query(
        `INSERT INTO ops_store (deputy_id, name, address, mobile, created_at)
         VALUES (?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE name=VALUES(name), address=VALUES(address)`,
        [c.Id, c.CompanyName || c.Code, c.Address || '', c.Phone || '']
      );
    }
  }
  console.log(`   ✅ 同步完成`);
  return companies.length;
}

async function main() {
  console.log('🚀 Deputy 数据同步开始');
  console.log(`   子域名: ${DEPUTY_SUBDOMAIN}`);
  console.log(`   数据库: ${DB_CONFIG.host}/${DB_CONFIG.database}`);

  const conn = await mysql.createConnection(DB_CONFIG);
  
  try {
    // 添加 deputy_id 列（如果不存在）
    const alterQueries = [
      'ALTER TABLE ops_staff ADD COLUMN IF NOT EXISTS deputy_id INT UNIQUE',
      'ALTER TABLE ops_shift ADD COLUMN IF NOT EXISTS deputy_id INT UNIQUE',
      'ALTER TABLE ops_attendance ADD COLUMN IF NOT EXISTS deputy_id INT UNIQUE',
      'ALTER TABLE ops_store ADD COLUMN IF NOT EXISTS deputy_id INT UNIQUE',
    ];
    for (const q of alterQueries) {
      try { await conn.query(q); } catch (e) { /* ignore if column exists */ }
    }

    const stats = {
      employees: await syncEmployees(conn),
      locations: await syncLocations(conn),
      rosters: await syncRosters(conn),
      timesheets: await syncTimesheets(conn),
    };

    console.log('\n════════════════════════════════════');
    console.log('✅ 同步完成！');
    console.log(`   员工: ${stats.employees}`);
    console.log(`   门店: ${stats.locations}`);
    console.log(`   排班: ${stats.rosters}`);
    console.log(`   考勤: ${stats.timesheets}`);
    console.log('════════════════════════════════════');
  } finally {
    await conn.end();
  }
}

main().catch(console.error);
