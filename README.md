# Big Fam Festival Application

A full-stack festival management application with a NestJS backend API and React Native mobile app built with Expo.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
  - [Backend Setup](#backend-setup)
  - [Mobile App Setup](#mobile-app-setup)
- [Environment Variables](#environment-variables)
- [Production Deployment](#production-deployment)
  - [Backend Deployment](#backend-deployment)
  - [Mobile App Deployment](#mobile-app-deployment)
- [Troubleshooting](#troubleshooting)

## 🎯 Project Overview

This application consists of:

- **Backend** (`/backend`): NestJS REST API with Firestore database
- **Mobile** (`/mobile`): React Native app built with Expo SDK 52
- **Infrastructure** (`/infrastructure`): Terraform configurations for Google Cloud Platform

### Key Features

- User authentication and authorization (JWT)
- Festival event management
- Personal schedule management
- Push notifications (Expo + Firebase Cloud Messaging)
- Artist and campsite information
- Festival map integration
- Role-based access control (Admin, Staff, Artist, Vendor, Volunteer, Director, Attendee)

## 🔧 Prerequisites

### Required Software

- **Node.js** 18.x or higher
- **npm** 9.x or higher (comes with Node.js)
- **Git**
- **Expo CLI** (`npm install -g expo-cli`)
- **Google Cloud SDK** (for production deployment)
- **Terraform** (for infrastructure deployment)
- **Docker** (for containerized builds)

### For Mobile Development

- **iOS Development**: macOS with Xcode 14+
- **Android Development**: Android Studio with Android SDK
- **Expo Go** app on your physical device (for testing)

### For Backend Development

- **Google Cloud Project** with Firestore enabled
- **Service Account** with Firestore and Firebase Admin permissions
- **Firebase Project** (for push notifications)

## 🚀 Local Development

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   
   Create a `.env` file in the `backend` directory:
   ```env
   NODE_ENV=development
   PORT=3000
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRATION=1d
   CORS_ORIGIN=*
   GOOGLE_PROJECT_ID=your-gcp-project-id
   STORAGE_BUCKET=your-storage-bucket-name
   GOOGLE_APPLICATION_CREDENTIALS=./path/to/your-service-account-key.json
   ```

   **Note:** For local development, you can either:
   - Set `GOOGLE_APPLICATION_CREDENTIALS` to the path of your service account JSON file
   - Or set it to the JSON content directly (the app will handle it)
   - Or omit it to use default credentials (if using `gcloud auth application-default login`)

4. **Run type checking:**
   ```bash
   npm run typecheck
   ```

5. **Start the development server:**
   ```bash
   npm run start:dev
   ```

   The API will be available at `http://localhost:3000`

6. **Access Swagger documentation:**
   
   Once the server is running, visit `http://localhost:3000/api/docs` for API documentation.

### Mobile App Setup

1. **Navigate to the mobile directory:**
   ```bash
   cd mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure API URL (if needed):**
   
   The app is configured to use the production API by default. For local development:
   
   - Update `mobile/src/config/constants.ts` to point to your local backend
   - Or set `EXPO_PUBLIC_API_URL` environment variable
   - For Android emulator, use `10.0.2.2` instead of `localhost`
   - For iOS simulator, use `localhost` as usual

4. **Start the Expo development server:**
   ```bash
   npm start
   ```

   This will:
   - Start the Metro bundler
   - Open Expo DevTools in your browser
   - Display a QR code for testing on physical devices

5. **Run on a device/simulator:**
   
   - **iOS Simulator**: Press `i` in the terminal or click "Run on iOS simulator" in Expo DevTools
   - **Android Emulator**: Press `a` in the terminal or click "Run on Android device/emulator" in Expo DevTools
   - **Physical Device**: Scan the QR code with Expo Go app (iOS) or Camera app (Android)

6. **Type checking:**
   ```bash
   npm run typecheck
   ```

## 🔐 Environment Variables

### Backend Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `NODE_ENV` | No | Environment (development/production/test) | `development` |
| `PORT` | No | Server port | `3000` |
| `JWT_SECRET` | **Yes** | Secret key for JWT token signing | - |
| `JWT_EXPIRATION` | No | JWT token expiration time | `1d` |
| `CORS_ORIGIN` | No | Allowed CORS origins | `*` |
| `GOOGLE_PROJECT_ID` | **Yes** | Google Cloud Project ID | - |
| `STORAGE_BUCKET` | **Yes** | Google Cloud Storage bucket name | - |
| `GOOGLE_APPLICATION_CREDENTIALS` | No* | Path to service account JSON or JSON string | - |

\* Required for local development, optional in Cloud Run (uses service account)

### Mobile Environment Variables

The mobile app uses Expo's configuration system. Key settings are in `app.json`:

- `extra.apiUrl`: API endpoint URL (defaults to production)
- Can be overridden with `EXPO_PUBLIC_API_URL` environment variable

## 🚢 Production Deployment

### Backend Deployment

The backend is deployed to **Google Cloud Run** using Docker containers.

#### Prerequisites

1. **Google Cloud Project** set up with:
   - Firestore database
   - Cloud Storage bucket
   - Artifact Registry repository
   - Service account with appropriate permissions

2. **Terraform** initialized and configured

#### Deployment Steps

**Option 1: Using PowerShell Script (Windows)**

```powershell
cd infrastructure/scripts
.\deploy-backend.ps1 -ProjectId "your-project-id" -Environment "production"
```

**Option 2: Manual Deployment**

1. **Build the Docker image:**
   ```bash
   cd backend
   gcloud builds submit --tag us-central1-docker.pkg.dev/YOUR_PROJECT_ID/bigfam-repository/bigfam-backend:latest
   ```

2. **Deploy with Terraform:**
   ```bash
   cd infrastructure/terraform
   terraform init
   terraform apply -var="project_id=YOUR_PROJECT_ID" -var="region=us-central1" -var="environment=production"
   ```

3. **Set Cloud Run environment variables:**
   
   In Google Cloud Console, navigate to Cloud Run service and set:
   - `NODE_ENV=production`
   - `PORT=8080`
   - `JWT_SECRET` (from Secret Manager or environment variable)
   - `JWT_EXPIRATION=1d`
   - `CORS_ORIGIN=*` (or specific origins)
   - `GOOGLE_PROJECT_ID=your-project-id`
   - `STORAGE_BUCKET=your-bucket-name`
   - `GOOGLE_APPLICATION_CREDENTIALS` (optional - Cloud Run uses service account by default)

4. **Verify deployment:**
   ```bash
   curl https://YOUR_SERVICE_URL/api/v1/health
   ```

#### Service Account Permissions

Ensure the Cloud Run service account has:
- `roles/datastore.user` (Firestore access)
- `roles/storage.objectAdmin` (Cloud Storage access)
- `roles/secretmanager.secretAccessor` (if using Secret Manager)
- Firebase Cloud Messaging Admin (for push notifications)

### Mobile App Deployment

The mobile app is built and deployed using **Expo Application Services (EAS)**.

#### Prerequisites

1. **Expo account** (sign up at [expo.dev](https://expo.dev))
2. **EAS CLI** installed:
   ```bash
   npm install -g eas-cli
   ```
3. **Apple Developer account** (for iOS)
4. **Google Play Console account** (for Android)

#### Build Configuration

The app uses EAS Build with configurations in `mobile/eas.json`:

- **development**: Development client builds
- **preview**: Internal distribution builds
- **production**: Production builds for app stores

#### Deployment Steps

1. **Login to Expo:**
   ```bash
   cd mobile
   eas login
   ```

2. **Configure the project:**
   ```bash
   eas build:configure
   ```

3. **Build for production:**

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

4. **Submit to app stores:**

   **iOS (App Store):**
   ```bash
   eas submit --platform ios --profile production
   ```

   **Android (Google Play):**
   ```bash
   eas submit --platform android --profile production
   ```

5. **Update app configuration:**
   
   Ensure `app.json` has the correct:
   - API URL in `extra.apiUrl`
   - Bundle identifiers
   - App icons and splash screens
   - Permissions

#### Environment-Specific Builds

To build with different API URLs:

```bash
# Development build
EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1 eas build --profile development

# Staging build
EXPO_PUBLIC_API_URL=https://staging-api.example.com/api/v1 eas build --profile preview

# Production build (uses default from app.json)
eas build --profile production
```

## 🐛 Troubleshooting

### Backend Issues

**Problem: Firestore connection fails**

- Verify `GOOGLE_PROJECT_ID` is correct
- Check service account has `datastore.user` role
- Ensure Firestore is enabled in your GCP project
- For local development, verify credentials file path is correct

**Problem: JWT authentication errors**

- Verify `JWT_SECRET` is set and consistent
- Check token expiration settings
- Ensure tokens are being sent in `Authorization: Bearer <token>` header

**Problem: CORS errors**

- Update `CORS_ORIGIN` to include your frontend URL
- Check that credentials are enabled in CORS config

**Problem: Port already in use**

- Change `PORT` in `.env` file
- Or kill the process using the port:
  ```bash
  # Windows
  netstat -ano | findstr :3000
  taskkill /PID <PID> /F
  
  # macOS/Linux
  lsof -ti:3000 | xargs kill
  ```

### Mobile App Issues

**Problem: Cannot connect to local backend**

- **Android Emulator**: Use `10.0.2.2` instead of `localhost`
- **iOS Simulator**: Use `localhost` or your machine's IP address
- Verify backend is running and accessible
- Check firewall settings

**Problem: Push notifications not working**

- Verify Firebase configuration files are present:
  - `google-services.json` (Android)
  - `GoogleService-Info.plist` (iOS)
- Check notification permissions are granted
- Ensure device is not a simulator/emulator (push notifications require physical devices)
- Verify Expo push token is registered with backend

**Problem: Build fails**

- Clear cache: `expo start -c`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check `eas.json` configuration
- Verify all required environment variables are set

**Problem: TypeScript errors**

- Run `npm run typecheck` to see all errors
- Ensure all dependencies are installed
- Check `tsconfig.json` configuration

### General Issues

**Problem: Dependencies installation fails**

- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`, then reinstall
- Use `npm ci` instead of `npm install` for consistent installs

**Problem: Git issues with credentials files**

- Ensure `.gitignore` includes sensitive files:
  - `*.json` (service account keys)
  - `.env` files
  - `node_modules/`

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Google Cloud Run](https://cloud.google.com/run/docs)
- [Firestore Documentation](https://cloud.google.com/firestore/docs)

## 📝 License

This project is private and proprietary.

## 👥 Contributors

Big Fam Festival Team

---

For questions or issues, please contact the development team.

