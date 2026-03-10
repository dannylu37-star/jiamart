# Jiamart Backend API

NestJS + TypeORM + PostgreSQL (Cloud SQL)

## Quick Start

```bash
cp .env.example .env
# fill in your DB credentials

npm run start:dev
```

API base: `http://localhost:3000/api/v1`

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/login | ❌ | Admin login → JWT |
| GET | /users | ✅ | List users |
| GET | /goods | ✅ | List goods |
| GET | /goods/categories | ✅ | Categories |
| GET | /orders | ✅ | List orders |
| GET | /orders/:id/details | ✅ | Order details |
| GET | /stock | ✅ | Stock levels |
| GET | /staff | ✅ | Staff list |
| GET | /store/config | ✅ | Store config |

## Deploy to Cloud Run

```bash
gcloud run deploy jiamart-backend \
  --source . \
  --region europe-west2 \
  --add-cloudsql-instances PROJECT:europe-west2:jiamart \
  --set-env-vars NODE_ENV=production \
  --set-secrets DB_PASSWORD=jiamart-db-password:latest,JWT_SECRET=jiamart-jwt-secret:latest \
  --allow-unauthenticated
```
