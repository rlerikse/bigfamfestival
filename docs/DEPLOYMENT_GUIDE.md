# Deployment Guide

This guide covers deploying the festival app for a new festival.

## Prerequisites

- Google Cloud Platform account with billing enabled
- Expo account (for mobile app builds)
- Firebase project
- Terraform installed
- Docker installed
- Node.js 18+ installed

## Backend Deployment

### 1. Set Up Google Cloud Project

```bash
# Create a new GCP project (or use existing)
gcloud projects create your-festival-project

# Set as active project
gcloud config set project your-festival-project

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com \
  artifactregistry.googleapis.com
```

### 2. Configure Terraform

1. Update `infrastructure/terraform/terraform.tfvars`:

```hcl
project_id = "your-festival-project"
region = "us-central1"
environment = "production"
festival_name = "yourfestival"
festival_id = "your-festival-id"  # Optional
api_title = "Your Festival API"
api_description = "API for Your Festival App"
cors_origin = "https://yourdomain.com"
```

2. Initialize Terraform:

```bash
cd infrastructure/terraform
terraform init
```

3. Review plan:

```bash
terraform plan
```

4. Apply:

```bash
terraform apply
```

### 3. Build and Deploy Backend

1. Build Docker image:

```bash
cd backend
gcloud builds submit --tag us-central1-docker.pkg.dev/YOUR_PROJECT_ID/your-repository/backend:latest
```

2. Deploy to Cloud Run (if not using Terraform):

```bash
gcloud run deploy your-festival-api \
  --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/your-repository/backend:latest \
  --platform managed \
  --region us-central1 \
  --set-env-vars NODE_ENV=production \
  --set-env-vars FESTIVAL_NAME="Your Festival" \
  --set-env-vars API_TITLE="Your Festival API" \
  --set-secrets JWT_SECRET=your-jwt-secret:latest
```

### 4. Set Environment Variables

In Google Cloud Console, set these environment variables for Cloud Run:

- `NODE_ENV=production`
- `PORT=8080`
- `JWT_SECRET` (from Secret Manager)
- `GOOGLE_PROJECT_ID=your-project-id`
- `STORAGE_BUCKET=your-bucket`
- `FESTIVAL_NAME=Your Festival`
- `FESTIVAL_SLUG=your-festival-slug`
- `API_TITLE=Your Festival API`
- `API_DESCRIPTION=API for Your Festival App`
- `CORS_ORIGIN=https://yourdomain.com`

## Mobile App Deployment

### 1. Configure EAS

1. Login to Expo:

```bash
cd mobile
eas login
```

2. Configure project:

```bash
eas build:configure
```

3. Create environment files:

Create `.env.production`:
```bash
EXPO_PUBLIC_FESTIVAL_NAME="Your Festival"
EXPO_PUBLIC_API_URL="https://your-api-url.run.app/api/v1"
# ... other environment variables
```

### 2. Build for Production

**iOS:**

```bash
eas build --platform ios --profile production
```

**Android:**

```bash
eas build --platform android --profile production
```

**Both:**

```bash
eas build --platform all --profile production
```

### 3. Submit to App Stores

**iOS:**

```bash
eas submit --platform ios --profile production
```

**Android:**

```bash
eas submit --platform android --profile production
```

## Post-Deployment Checklist

- [ ] Verify API health endpoint responds
- [ ] Test authentication flow
- [ ] Verify push notifications work
- [ ] Test schedule functionality
- [ ] Verify map loads (if enabled)
- [ ] Check error logging (Sentry)
- [ ] Monitor API performance
- [ ] Set up alerts for errors
- [ ] Configure backup strategy
- [ ] Document API endpoints

## Monitoring

### Backend Monitoring

- Cloud Run metrics in GCP Console
- Firestore usage metrics
- API error rates
- Response times

### Mobile App Monitoring

- Sentry for crash reporting
- Analytics for user behavior
- App Store reviews and ratings

## Troubleshooting

### Backend Issues

**API not responding:**
- Check Cloud Run service status
- Verify environment variables
- Check logs: `gcloud run logs read your-festival-api`

**Database connection errors:**
- Verify Firestore is enabled
- Check service account permissions
- Verify GOOGLE_PROJECT_ID is correct

### Mobile App Issues

**Build failures:**
- Check environment variables
- Verify Firebase config
- Check EAS build logs

**Runtime errors:**
- Check Sentry for crash reports
- Verify API URL is correct
- Check network connectivity

## Scaling

### Backend Scaling

Cloud Run automatically scales based on traffic. Configure:

- Min instances: 0 (for cost) or 1+ (for always-on)
- Max instances: Based on expected traffic
- Concurrency: Default is 80 requests per instance

### Database Scaling

Firestore automatically scales. Monitor:
- Read/write operations
- Storage usage
- Index usage

## Security

- Use Secret Manager for sensitive values
- Enable Cloud Armor for DDoS protection
- Configure CORS properly
- Use HTTPS everywhere
- Regular security audits

## Backup and Recovery

- Firestore: Enable point-in-time recovery
- Cloud Storage: Enable versioning
- Regular backups of critical data
- Document recovery procedures

## Cost Optimization

- Use Cloud Run (pay per use)
- Set appropriate min/max instances
- Monitor Firestore usage
- Use Cloud CDN for static assets
- Regular cost reviews

