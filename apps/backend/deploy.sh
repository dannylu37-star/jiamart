#!/bin/bash
set -e

PROJECT=jiamart
REGION=europe-west2
SERVICE=jiamart-backend
INSTANCE=jiamart:europe-west2:jiamart
IMAGE=${REGION}-docker.pkg.dev/${PROJECT}/jiamart/backend

echo "🔧 Step 1: Enable APIs"
gcloud services enable run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com sqladmin.googleapis.com --project $PROJECT

echo "📦 Step 2: Create Artifact Registry repo (skip if exists)"
gcloud artifacts repositories create jiamart \
  --repository-format=docker \
  --location=$REGION \
  --project=$PROJECT 2>/dev/null || true

echo "🔐 Step 3: Store secrets"
echo -n "Work4future！" | gcloud secrets create jiamart-db-password --data-file=- --project=$PROJECT 2>/dev/null || \
  echo -n "Work4future！" | gcloud secrets versions add jiamart-db-password --data-file=- --project=$PROJECT

openssl rand -base64 32 | gcloud secrets create jiamart-jwt-secret --data-file=- --project=$PROJECT 2>/dev/null || \
  echo "jwt secret already exists"

echo "🐳 Step 4: Build & Push image"
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet
gcloud builds submit . \
  --tag ${IMAGE}:latest \
  --project $PROJECT

echo "🚀 Step 5: Deploy to Cloud Run"
gcloud run deploy $SERVICE \
  --image ${IMAGE}:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5 \
  --add-cloudsql-instances ${INSTANCE} \
  --set-secrets="DB_PASSWORD=jiamart-db-password:latest,JWT_SECRET=jiamart-jwt-secret:latest" \
  --set-env-vars="NODE_ENV=production,DB_HOST=/cloudsql/${INSTANCE},DB_USERNAME=jiamart,DB_NAME=jiamart_shop,DB_PORT=5432" \
  --project $PROJECT

echo ""
echo "✅ Deployed! URL:"
gcloud run services describe $SERVICE --region $REGION --project $PROJECT \
  --format="value(status.url)"
