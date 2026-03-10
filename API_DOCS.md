# Jiamart Admin API 接口文档

> 生成时间：2026-03-07  
> 后端地址：`https://jiamart-backend-851457000209.europe-west2.run.app/api/v1`  
> 认证方式：所有接口需携带 `Authorization: Bearer <JWT Token>`

---

## 认证 Auth

### POST `/auth/login`
登录获取 JWT Token

**请求体：**
```json
{ "username": "admin", "password": "Jiamart2026!" }
```
**响应：**
```json
{
  "success": true,
  "data": {
    "access_token": "<jwt>",
    "user": { "id": 209, "username": "admin", "role": "admin", "storeId": null }
  }
}
```

---

## 员工管理 Ops Staff

### GET `/ops/staff`
获取员工列表

**查询参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| `status` | string | `active`（在职）/ `inactive`（离职）/ `all`（全部），默认 `active` |

**响应 data：** `OpsStaff[]`
```typescript
{
  id: number
  name: string
  email: string
  mobile: string
  position: string
  department: string
  storeId: number
  status: 'active' | 'inactive'
  role: string
  deputyId: string
  hireDate: string
  contractEnd: string
  driveFolderUrl: string
  staffCode: string
}
```

### PUT `/ops/staff/:id`
更新员工信息

**请求体（部分字段）：**
```json
{
  "name": "张三",
  "email": "zhang@example.com",
  "mobile": "+44 7700 000000",
  "status": "active",
  "role": "manager",
  "storeId": 3
}
```

### GET `/ops/roles`
获取角色枚举列表

**响应 data：**
```json
[
  { "value": "admin", "label": "管理员" },
  { "value": "manager", "label": "店长" },
  { "value": "employee", "label": "员工" }
]
```

---

## 门店管理 Stores

### GET `/stores`
获取所有门店（完整信息）

**响应 data：** `Store[]`
```typescript
{
  id: number
  name: string
  address: string
  mobile: string
  managerId: number
  deputyId: number
  status: boolean
  createdAt: string
}
```

### GET `/ops/stores-list`
获取门店简要列表（用于下拉选择）

**响应 data：** `{ id, name }[]`

### POST `/stores`
新增门店

**请求体：**
```json
{ "name": "Jiamart Example", "address": "123 Street, London", "mobile": "+44...", "status": true }
```

### PUT `/stores/:id`
更新门店信息（同上结构）

### DELETE `/stores/:id`
撤销门店（软删除，status 设为 false）

---

## 考勤记录 Attendance

### GET `/ops/attendance`
获取考勤记录

**查询参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| `date` | string | 日期过滤，格式 `YYYY-MM-DD` |
| `staffId` | number | 按员工 ops_staff.id 过滤 |

**响应 data：**
```typescript
{
  id: number
  staffId: number        // Deputy ID（非 ops_staff.id）
  staffName: string      // 员工姓名（通过 deputy_id 关联）
  storeName: string      // 所属门店名称
  clockIn: string        // ISO 时间
  clockOut: string
  workedMinutes: number
  status: 'normal' | 'late' | 'absent' | 'early'
  photoUrl: string
}
```

> ⚠️ `staffId` 字段对应的是 Deputy 系统的员工 ID，与 ops_staff.id 不同，通过 `ops_staff.deputy_id` 关联。

---

## 入职核查 Checklist

### GET `/ops/checklist`
获取所有员工入职核查汇总

**响应 data：** 每个员工的核查进度汇总
```typescript
{
  staffId: number
  staffName: string
  total: number
  verified: number
  submitted: number
  pending: number
  rejected: number
}
```

### GET `/ops/checklist/:staffId`
获取单个员工的核查项详情

**响应 data：**
```typescript
{
  id: number
  itemName: string
  status: 'pending' | 'submitted' | 'verified' | 'rejected'
  docUrl: string   // 文件链接（Google Drive 等）
  notes: string
  verifiedAt: string
}[]
```

### PUT `/ops/checklist/item/:itemId`
更新核查项（管理员代为操作）

**请求体：**
```json
{
  "status": "verified",
  "docUrl": "https://drive.google.com/...",
  "notes": "已电话确认"
}
```
> 状态改为 `verified` 时自动记录 `verified_by`（当前登录用户 id）和 `verified_at`（当前时间）

---

## 薪资 Payroll

### GET `/ops/payroll`
获取薪资记录

**查询参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| `periodStart` | string | 周期开始日期 |
| `periodEnd` | string | 周期结束日期 |

---

## 营业额 Orders

### GET `/orders/summary`
获取营业额汇总数据

**查询参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| `dateFrom` | string | 开始日期 `YYYY-MM-DD` |
| `dateTo` | string | 结束日期 `YYYY-MM-DD` |

**响应 data：**
```typescript
{
  totals: {
    totalRevenue: number    // 净销售额（已扣退款）
    orderCount: number      // 订单数
    avgOrder: number        // 客单价
  },
  payBreakdown: {
    payMethod: string       // 支付方式
    total: number
    count: number
  }[],
  dailyTrend: {
    date: string
    revenue: number
    orderCount: number
  }[]
}
```

> ⚠️ 订单表 `sp_order` 目前无 `store_id` 字段，门店筛选暂无法按门店过滤数据。

### GET `/orders`
获取订单列表

**查询参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| `dateFrom` | string | 开始日期 |
| `dateTo` | string | 结束日期 |
| `page` | number | 页码 |
| `limit` | number | 每页条数 |

---

## 商品管理 Goods

### GET `/goods`
获取商品列表

**查询参数：**
| 参数 | 类型 | 说明 |
|------|------|------|
| `search` | string | 搜索关键词（名称/英文名/SKU） |
| `status` | string | `on`（在售）/ `off`（下架）/ 空（全部） |
| `businessLine` | string | `supermarket` / `milktea` / `ramen` |
| `page` | number | 页码，默认 1 |
| `limit` | number | 每页条数，默认 20 |

---

## 数据库说明

### 连接信息
- **Host：** Cloud SQL `34.147.180.155`（TCP）或 Unix Socket `/cloudsql/jiamart:europe-west2:jiamart`
- **Instance：** `jiamart:europe-west2:jiamart`
- **User：** `jiamart`
- **Secret：** GCP Secret Manager `jiamart-db-password`

### 数据库结构
| 数据库 | 说明 | 主要表 |
|--------|------|--------|
| `jiamart_shop` | 客户端数据 | `sp_order`, `sp_goods`, `sp_users` |
| `jiamart_ops` | 运营管理 | `ops_staff`, `ops_store`, `ops_attendance`, `ops_payroll`, `ops_onboarding_checklist` |

### 关键表字段备注
- `sp_users.role`：默认 `employee`，可选 `admin` / `manager` / `employee`
- `sp_users.store_id`：员工所属门店（数字 ID）
- `ops_attendance.staff_id`：存 Deputy 系统 ID，非 ops_staff.id
- `ops_staff.deputy_id`：对应 Deputy 系统员工 ID（VARCHAR）

---

## 部署信息

### 后端 Cloud Run
```bash
# Build
gcloud builds submit \
  --tag europe-west2-docker.pkg.dev/jiamart/cloud-run-source-deploy/jiamart-backend:latest \
  --service-account projects/jiamart/serviceAccounts/cloudbuild-sa@jiamart.iam.gserviceaccount.com \
  --gcs-source-staging-dir gs://jiamart-cloudbuild-eu/source \
  --gcs-log-dir gs://jiamart-cloudbuild-eu/logs \
  --region europe-west2

# Deploy
gcloud run deploy jiamart-backend \
  --image europe-west2-docker.pkg.dev/jiamart/cloud-run-source-deploy/jiamart-backend:latest \
  --region europe-west2 \
  --service-account jiamart-backend@jiamart.iam.gserviceaccount.com \
  --add-cloudsql-instances jiamart:europe-west2:jiamart \
  --quiet
```

### 前端 Netlify
```bash
cd /path/to/jiamart-dashboard && npm run build
rm -rf "/path/to/jiamart website/admin"
cp -r dist "/path/to/jiamart website/admin"
cd "/path/to/jiamart website"
netlify deploy --prod --dir . --site cd12149f-27c0-4374-97f4-36a46f001dac
```

### 环境变量（Cloud Run）
| 变量 | 值 |
|------|-----|
| `DB_HOST` | `/cloudsql/jiamart:europe-west2:jiamart` |
| `DB_PORT` | `3306` |
| `DB_USER` | `jiamart` |
| `DB_NAME` | `jiamart_shop` |
| `JWT_SECRET` | GCP Secret |
| `NODE_ENV` | `production` |

---

## 当前版本

| 组件 | 版本/ID |
|------|---------|
| Backend Cloud Run | `jiamart-backend-00057-9lh` |
| Frontend Netlify | `69acaab5177d675d8b0acd6b` |
| 前端 URL | https://jiamart.co.uk/admin/ |
| 后端 URL | https://jiamart-backend-851457000209.europe-west2.run.app/api/v1 |
