# Jiamart Backend API v1

Base URL: `https://YOUR_CLOUD_RUN_URL/api/v1`
Auth: `Authorization: Bearer <JWT>`

---

## Auth
| Method | Path | 说明 |
|--------|------|------|
| POST | /auth/login | 用户名+密码登录，返回 JWT |
| GET  | /auth/google | Google OAuth 跳转 |
| GET  | /auth/google/callback | OAuth 回调 |

---

## Goods（商品）
| Method | Path | 说明 |
|--------|------|------|
| GET    | /goods?page=1&limit=20 | 商品列表（分页） |
| GET    | /goods/:id | 商品详情 |
| POST   | /goods | 新建商品 |
| PUT    | /goods/:id | 更新商品 |
| DELETE | /goods/:id | 软删除商品 |

---

## Orders（订单）
| Method | Path | 说明 |
|--------|------|------|
| GET    | /orders?page=1&status= | 订单列表 |
| GET    | /orders/summary | KPI汇总（日销售额/订单数/支付方式） |
| GET    | /orders/:id | 订单详情（含明细+用户） |
| PUT    | /orders/:id/status | 更新订单状态 |

---

## Stock（库存）
| Method | Path | 说明 |
|--------|------|------|
| GET    | /stock | 全部库存 |
| GET    | /stock/low?threshold=10 | 低库存预警 |
| POST   | /stock/adjust | 库存调整 `{goodsId, delta, reason}` |

---

## Stores（门店）
| Method | Path | 说明 |
|--------|------|------|
| GET    | /stores | 全部门店（8家） |
| GET    | /stores/:id | 门店详情 |
| POST   | /stores | 新建门店 |
| PUT    | /stores/:id | 更新门店 |

---

## Staff（员工基础）
| Method | Path | 说明 |
|--------|------|------|
| GET    | /staff | 员工列表 |
| GET    | /staff/:id | 员工详情 |
| POST   | /staff | 新建员工 |
| PUT    | /staff/:id | 更新员工 |
| DELETE | /staff/:id | 离职（软删除） |

---

## Ops（运营管理）
### 员工档案
| Method | Path | 说明 |
|--------|------|------|
| GET    | /ops/staff | 完整员工档案列表 |
| GET    | /ops/staff/:id | 详情 |
| POST   | /ops/staff | 新建 |
| PUT    | /ops/staff/:id | 更新 |

### 排班
| Method | Path | 说明 |
|--------|------|------|
| GET    | /ops/shifts?start=YYYY-MM-DD&end=YYYY-MM-DD&store= | 排班列表 |
| POST   | /ops/shifts | 新建排班 |
| PUT    | /ops/shifts/:id | 更新排班 |

### 出勤打卡
| Method | Path | 说明 |
|--------|------|------|
| GET    | /ops/attendance?staffId=&date= | 打卡记录 |
| POST   | /ops/attendance/clock-in | 上班打卡（GPS+照片） |
| PUT    | /ops/attendance/:id/clock-out | 下班打卡 |

### 薪资
| Method | Path | 说明 |
|--------|------|------|
| GET    | /ops/payroll?start=&end= | 工资单列表 |
| POST   | /ops/payroll | 生成工资单 |
| PUT    | /ops/payroll/:id/approve | 审批 |
| PUT    | /ops/payroll/:id/paid | 标记已发放 |

---

## 响应格式
```json
{ "success": true, "data": {...}, "timestamp": "2026-03-01T..." }
```

## 错误格式
```json
{ "success": false, "statusCode": 401, "message": "...", "timestamp": "..." }
```
