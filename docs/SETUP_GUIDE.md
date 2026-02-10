# Setup Guide for New Festivals

This guide walks you through setting up the festival app for a new festival from scratch.

## Quick Start

1. **Clone the repository**
2. **Configure environment variables**
3. **Set up Firebase project**
4. **Deploy backend**
5. **Build mobile app**
6. **Test and launch**

## Step-by-Step Setup

### Step 1: Repository Setup

```bash
git clone <repository-url>
cd bigfamfestival
```

### Step 2: Backend Setup

1. **Install dependencies:**

```bash
cd backend
npm install
```

2. **Create `.env` file:**

```bash
NODE_ENV=development
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRATION=1d
CORS_ORIGIN=*
GOOGLE_PROJECT_ID=your-gcp-project-id
STORAGE_BUCKET=your-storage-bucket-name
GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account-key.json

# Festival-specific
FESTIVAL_NAME=Your Festival Name
FESTIVAL_SLUG=your-festival-slug
FESTIVAL_ID=your-festival-id
API_TITLE=Your Festival API
API_DESCRIPTION=API for Your Festival App
```

3. **Set up Firestore:**

- Create Firestore database in GCP Console
- Enable Firestore API
- Create service account with Firestore permissions

4. **Run locally:**

```bash
npm run start:dev
```

API will be available at `http://localhost:3000`

### Step 3: Mobile App Setup

1. **Install dependencies:**

```bash
cd mobile
npm install
```

2. **Configure environment:**

Create `.env` file or set environment variables:

```bash
EXPO_PUBLIC_FESTIVAL_NAME="Your Festival"
EXPO_PUBLIC_FESTIVAL_SLUG="your-festival-slug"
EXPO_PUBLIC_FESTIVAL_START_DATE="2025-06-15"
EXPO_PUBLIC_FESTIVAL_END_DATE="2025-06-17"
EXPO_PUBLIC_API_URL="http://localhost:3000/api/v1"
# ... other config (see WHITE_LABEL_GUIDE.md)
```

3. **Update app.json:**

- Change `name` to your festival name
- Update `slug`
- Update bundle identifiers
- Update permission descriptions

4. **Replace assets:**

- App icon: `src/assets/images/icon.png`
- Splash screen: `src/assets/images/splash.png`
- Logo: `src/assets/images/bf-logo-trans.png`

5. **Run locally:**

```bash
npm start
```

### Step 4: Firebase Setup

#### 4.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project or select existing GCP project
3. Enable the following services:
   - **Authentication** (Email/Password provider)
   - **Firestore Database**
   - **Cloud Messaging** (for push notifications)

#### 4.2 Configure Firebase Authentication

1. In Firebase Console → Authentication → Sign-in method
2. Enable **Email/Password** provider
3. Optionally configure password policy (Firebase default: 6+ chars, we recommend 8+)
4. Configure email templates under Templates tab:
   - Password reset email
   - Email verification (optional)

#### 4.3 Backend Firebase Configuration

1. **Create Service Account:**
   - Firebase Console → Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save JSON file securely (do NOT commit to git)

2. **Configure Backend:**
   ```bash
   # In backend/.env
   GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account-key.json
   GOOGLE_PROJECT_ID=your-firebase-project-id
   ```

3. **Verify Firebase Admin SDK is initialized:**
   The backend automatically initializes Firebase Admin in `app.module.ts` using the service account.

#### 4.4 Mobile Firebase Configuration

1. **Get Firebase config files:**
   - Firebase Console → Project Settings → Your apps
   - Add iOS app → Download `GoogleService-Info.plist`
   - Add Android app → Download `google-services.json`

2. **Place config files:**
   ```
   mobile/
   ├── GoogleService-Info.plist  (root level for Expo)
   └── google-services.json       (root level for Expo)
   ```

3. **iOS additional setup:**
   ```bash
   cd mobile/ios
   pod install
   ```

4. **Verify Firebase packages:**
   The app uses `@react-native-firebase/app` and `@react-native-firebase/auth` for authentication.

#### 4.5 User Migration (Existing Festivals Only)

If migrating from an older version with bcrypt password hashes:

```bash
cd backend

# Dry run to test migration
npm run migrate:firebase:dry

# Run actual migration (imports users to Firebase Auth)
npm run migrate:firebase
```

This preserves existing user UIDs and allows login with original passwords.

### Step 5: Testing

1. **Backend tests:**

```bash
cd backend
npm test
```

2. **Mobile tests:**

```bash
cd mobile
npm test
```

3. **Manual testing:**

- Test authentication
- Test schedule functionality
- Test notifications
- Test map (if enabled)

### Step 6: Production Deployment

See `DEPLOYMENT_GUIDE.md` for detailed deployment instructions.

## Common Issues

### Issue: Firebase config not loading

**Solution:** Ensure environment variables are prefixed with `EXPO_PUBLIC_` for mobile app.

### Issue: API connection fails

**Solution:** 
- Verify API URL is correct
- Check CORS settings
- Ensure backend is running

### Issue: Build fails

**Solution:**
- Clear cache: `expo start -c`
- Delete `node_modules` and reinstall
- Check all environment variables are set

## Next Steps

After setup:
1. Customize theme colors
2. Add festival-specific content
3. Configure push notifications
4. Set up analytics
5. Deploy to staging
6. User acceptance testing
7. Deploy to production

## Support Resources

- `WHITE_LABEL_GUIDE.md` - Configuration reference
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `AUDIT_REPORT.md` - Codebase overview
- `README.md` - General documentation

