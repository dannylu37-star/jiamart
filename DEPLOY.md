# Jiamart 部署清单

## 一次性准备工作（首次部署前）

### 1. 数据库 Migration（在 jiamart_ops 库执行）

按顺序执行以下 SQL 文件：

```bash
# 在 Cloud SQL 或本地 mysql 执行
mysql -u jiamart -p jiamart_ops < apps/backend/src/schedule-context/migrations/create_schedule_context_tables.sql
mysql -u jiamart -p jiamart_ops < apps/backend/src/vendor/migrations/create_vendor_tables.sql
mysql -u jiamart -p jiamart_ops < apps/backend/src/ai-forecast/migrations/create_ai_forecast_tables.sql

# 可选：种入大学假期初始数据
mysql -u jiamart -p jiamart_ops < apps/backend/src/schedule-context/migrations/seed_university_terms.sql
```

### 2. 安装 xlsx 依赖（本地开发）

```bash
cd apps/backend && npm install xlsx
```

### 3. 创建 GCS Bucket（供应商表单存储）

```bash
gsutil mb -l europe-west2 gs://jiamart-files
# 给 Cloud Run SA 写权限
gsutil iam ch serviceAccount:cloudbuild-sa@jiamart.iam.gserviceaccount.com:objectAdmin gs://jiamart-files
```

### 4. 初始化节假日数据

部署后调用一次接口写入当年 + 明年节假日：

```bash
# CN
curl -X POST "https://your-backend/schedule-context/init-holidays?year=2026&region=CN" -H "Authorization: Bearer <token>"
# GB
curl -X POST "https://your-backend/schedule-context/init-holidays?year=2026&region=GB" -H "Authorization: Bearer <token>"
```

或直接在后台触发（本地开发可调用 HolidayService.fetchAndCacheHolidays）。

---

## 常规部署

### 后端（Cloud Run）

```bash
cd apps/backend
gcloud auth login --no-launch-browser   # token 过期时
gcloud builds submit --config cloudbuild.yaml --project jiamart
```

### 前端（Netlify）

```bash
cd apps/dashboard
npm run build
# 拖拽 dist/ 到 Netlify，或用 netlify-cli:
npx netlify deploy --prod --dir=dist
```

---

## 环境变量（Cloud Run）

| 变量 | 值 |
|------|-----|
| DB_HOST | /cloudsql/jiamart:europe-west2:jiamart |
| DB_USERNAME | jiamart |
| DB_NAME | jiamart_shop |
| OPS_DB_NAME | jiamart_ops |
| GCS_BUCKET | jiamart-files |
| NODE_ENV | production |
| DB_PASSWORD | (Secret Manager: jiamart-db-password) |
| JWT_SECRET | (Secret Manager: jiamart-jwt-secret) |

---

## 新功能 API 一览

### 排班上下文（节假日/天气/大学假期）
```
GET /schedule-context/info?storeId=1&startDate=2026-03-10&endDate=2026-03-24
```

### AI 预测
```
POST /ai-forecast/generate?storeId=1          # 生成全量预测
POST /ai-forecast/generate/staffing?storeId=1  # 仅排班
GET  /ai-forecast/latest/sales_7d?storeId=1
GET  /ai-forecast/schedule-drafts?storeId=1
GET  /ai-forecast/purchase-drafts?storeId=1
PATCH /ai-forecast/schedule-drafts/:id/confirm
PATCH /ai-forecast/purchase-drafts/:id/reject
```

### 供应商管理
```
GET/POST  /vendors
GET       /vendors/:id
POST      /vendors/:id/products
POST      /vendors/:id/forms/upload    (multipart)
POST      /vendors/forms/:id/parse
POST      /vendors/forms/:id/approve
```

---

## Git 历史

```
26fb602  feat: frontend AI forecast + vendor management pages
ff2c9a9  feat: AI forecast module
da51d3a  feat: schedule-context + vendor backend + ScheduleContextBar
fd6b069  chore: initial commit from backup 20260307
```
