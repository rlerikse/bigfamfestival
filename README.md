# Big Fam Festival Application

**Current Version:** 1.4.2 | **Platforms:** iOS, Android | **Status:** Production

A full-stack festival management application with a NestJS backend API and React Native mobile app built with Expo.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Architecture Decisions](#architecture-decisions)
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
- **Mobile** (`/mobile`): React Native app built with Expo SDK 54
- **Admin** (`/admin`): React + Vite admin panel (Firebase Hosting)
- **Infrastructure** (`/infrastructure`): Terraform configurations for Google Cloud Platform

### Key Features

- User authentication and authorization (Firebase Auth + JWT)
- Festival event management with artist profiles
- Personal schedule management
- Interactive festival map with live friend locations for opted-in friends
- Push notifications
- Admin panel for event/artist CRUD
- Artist bios, social links, and website URLs
- Image management via Firebase Storage
- Push notifications (Expo + Firebase Cloud Messaging)
- Artist and campsite information
- Festival map integration
- Role-based access control (Admin, Staff, Artist, Vendor, Volunteer, Director, Attendee)

### Map and friend-location experience

- **Live friend locations:** opted-in friends appear on the festival map as their location changes. The app receives authenticated Server-Sent Events (SSE) updates rather than polling every 30 seconds; if the stream is unavailable, it temporarily falls back to polling while it reconnects.
- **Stable compass and camera:** heading uses the device's OS-calibrated compass with gyro-assisted smoothing (orientation-independent, spike-rejecting), seam-safe transitions, and throttled camera updates. The map defaults to north-up; the heading-follow compass mode is being hardened before it becomes the default.
- **Stable friend markers and HUD:** friend radar markers are quantized and constrained at the map edge so they remain readable and do not bounce or jitter as the device heading changes.

## 🏛️ Architecture Decisions

Significant technical decisions are recorded as Architecture Decision Records (ADRs). [`ADR.md`](ADR.md) is the full chronological log — **16 decisions from repo inception (2025-03) through 2026-07** — covering the monorepo layout, NestJS + Firestore backend, Cloud Run/Terraform infra, Expo mobile, the Firebase Auth migration, the admin panel, Mapbox mapping, the friend/location system, and more. Narrative source files for the first two live in [`docs/adr/`](docs/adr/).

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-001](docs/adr/001-performance-optimizations.md) | Performance Optimizations for Artist Modal | ✅ Accepted |
| [ADR-002](docs/adr/002-realtime-friend-locations-sse.md) | Realtime Friend Locations via Server-Sent Events | ✅ Accepted |

See [`ADR.md`](ADR.md) for the full index (ADR-001 – ADR-016). To add a decision, create the next-numbered file in `docs/adr/` and add it to [`ADR.md`](ADR.md).

## 🔧 Prerequisites

### Required Software

- **Node.js** 18.x or higher
- **npm** 9.x or higher (comes with Node.js)
- **Git**

After cloning, enable local pre-commit lint auto-fix (keeps `--fix` out of CI):

```bash
git config core.hooksPath .githooks
```
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

## 🌿 Branch Naming Convention

All branches should follow one of these prefixes so CI, automation, and reviewers can quickly tell intent:

| Prefix | Purpose | Example |
|---|---|---|
| `feature/` | New feature work | `feature/friend-radar-hud` |
| `fix/` | Bug fix (non-urgent) | `fix/schedule-scroll-jump` |
| `hotfix/` | Urgent production fix, typically branched from `main` | `hotfix/crash-on-launch` |
| `wip/` | Work-in-progress / exploratory, not yet ready for review | `wip/map-routing` |
| `release/` | Release-candidate branches (also gate EAS builds, see CI) | `release/1.3.0` |
| `chore/` | Tooling, CI, docs, dependency bumps | `chore/branch-hygiene` |

Older/legacy naming (e.g. bare `feat/...` without a slash-separated scope) is still tolerated but new branches should use the table above. A CI check on PR open flags non-conforming branch names as an advisory warning (does not block merge). A weekly scheduled job (`.github/workflows/prune-stale-branches.yml`) automatically deletes branches that have already been **merged** into `dev` or `main`, to keep the branch list clean — it never touches unmerged/open-PR branches.

## 🚢 Production Deployment

### Versioning & Releases

This project uses **unified semantic versioning** across the whole app — mobile and backend track together as one version (no independent per-package versions). Source of truth: `.release-please-manifest.json` (root), mirrored into `mobile/package.json`, `mobile/app.json` (`expo.version`), and `backend/package.json`.

- Commits to `dev`/`main` must follow [Conventional Commits](https://www.conventionalcommits.org/) (already enforced) — `feat:`, `fix:`, `feat!:`/`BREAKING CHANGE:`, etc. drive the version bump type (minor/patch/major).
- [release-please](https://github.com/googleapis/release-please) (`.github/workflows/release-please.yml`) watches `main`. On merge, it opens/updates a standing **Release PR** with the version bump + generated `CHANGELOG.md`.
- Nothing ships automatically — merging that Release PR is the explicit release trigger. On merge it creates git tag `vX.Y.Z` + a GitHub Release.
- That tag push (`v*.*.*`) is what fires the EAS store build job in `.github/workflows/mobile-ci.yml` — see PR #113/#194 EAS gating.
- Android's `versionCode` in `mobile/app.json` is a **separate** counter auto-incremented by EAS (`eas.json` `autoIncrement: true`) — release-please does not touch it.

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

   > **Android signing — current path (as of v1.2.2):** Store-track Android
   > builds are signed with the Play **upload key** (SHA-1
   > `9B:50:41:8D:93:AB:F3:49:4F:F1:4A:B7:F6:E3:9C:56:1E:81:B2:FF`), whose
   > keystore is managed remotely by EAS. For local release builds, export the
   > EAS keystore and point the Gradle `BIGFAM_UPLOAD_*` properties in
   > `~/.gradle/gradle.properties` at it, then build + upload:
   >
   > ```bash
   > # from mobile/android
   > JAVA_HOME=$(brew --prefix openjdk@17) ./gradlew bundleRelease
   > # verify the signing cert before uploading:
   > keytool -printcert -jarfile app/build/outputs/bundle/release/app-release.aab | grep SHA1
   > # must print 9B:50:41:8D:...:B2:FF
   > ```
   >
   > Do **not** sign with any other local keystore — Play rejects mismatched
   > upload keys. `versionCode` must be strictly increasing (last accepted: 80).

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

