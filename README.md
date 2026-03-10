# Jiamart 后台系统 — 备份说明

> 备份时间：2026-03-07 23:29 (Europe/London)

## 目录结构

```
Jiamart_Backup_20260307_2329/
├── README.md              ← 本文件
├── API_DOCS.md            ← 完整接口文档
├── jiamart-dashboard/     ← 前端源码 (React + Vite + Tailwind)
│   ├── src/
│   │   ├── pages/         ← 各页面组件
│   │   │   ├── Staff.jsx      员工管理
│   │   │   ├── Attendance.jsx 考勤记录
│   │   │   ├── Records.jsx    员工档案（入职核查+Drive）
│   │   │   ├── Sales.jsx      营业额
│   │   │   ├── Goods.jsx      商品管理
│   │   │   └── Stores.jsx     门店管理
│   │   ├── components/
│   │   │   └── Layout.jsx     侧边栏导航
│   │   ├── App.jsx            路由配置
│   │   └── api.js             Axios 实例（自动带 JWT）
│   ├── package.json
│   └── vite.config.js
│
└── jiamart-backend/       ← 后端源码 (NestJS)
    ├── src/
    │   ├── app.module.ts      双数据库连接配置（shop + ops）
    │   ├── auth/              登录 JWT 认证
    │   ├── ops/               员工/考勤/核查/薪资模块
    │   │   ├── ops.controller.ts
    │   │   └── ops.service.ts
    │   ├── store/             门店 CRUD
    │   ├── orders/            订单 + 营业额汇总
    │   ├── goods/             商品管理
    │   └── entities/          TypeORM 实体定义
    ├── Dockerfile
    └── package.json
```

## 快速恢复

### 前端本地开发
```bash
cd jiamart-dashboard
npm install
npm run dev
# 访问 http://localhost:5173/admin/
```

### 后端本地开发
```bash
cd jiamart-backend
npm install
# 配置 .env（见 API_DOCS.md 环境变量）
npm run start:dev
```

## 重要说明

1. **双数据库**：后端用了两个 TypeORM 连接，`default` 连 `jiamart_shop`，`ops` 连 `jiamart_ops`，实体注入时需区分。

2. **考勤 staff_id 是 Deputy ID**：`ops_attendance.staff_id` 存的是 Deputy 系统 ID，不是 `ops_staff.id`，需通过 `ops_staff.deputy_id` 关联。

3. **Cloud Build SA**：默认 Compute Engine SA 已被删除，必须用 `cloudbuild-sa@jiamart.iam.gserviceaccount.com`。

4. **订单无 store_id**：`sp_order` 表目前无门店字段，营业额门店筛选暂未实现后端过滤。
