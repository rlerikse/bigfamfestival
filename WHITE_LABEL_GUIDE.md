# White-Label Setup Guide

This guide explains how to configure the festival app for a new festival (white-labeling).

## Overview

The app uses a centralized configuration system that allows you to customize:
- Festival name, dates, and location
- Theme colors
- API endpoints
- Firebase configuration
- Bundle identifiers
- Feature flags

## Mobile App Configuration

### 1. Environment Variables

Create a `.env` file in the `mobile` directory or set environment variables:

```bash
# Festival Information
EXPO_PUBLIC_FESTIVAL_NAME="Your Festival Name"
EXPO_PUBLIC_FESTIVAL_SLUG="your-festival-slug"
EXPO_PUBLIC_FESTIVAL_START_DATE="2025-06-15"
EXPO_PUBLIC_FESTIVAL_END_DATE="2025-06-17"

# Festival Dates (JSON array)
EXPO_PUBLIC_FESTIVAL_DATES='[{"id":"2025-06-15","date":"2025-06-15","dayLabel":"Jun 15","dayAbbrev":"SAT","staffOnly":false},{"id":"2025-06-16","date":"2025-06-16","dayLabel":"Jun 16","dayAbbrev":"SUN","staffOnly":false}]'

# Location
EXPO_PUBLIC_FESTIVAL_LOCATION_NAME="Your City, State"
EXPO_PUBLIC_FESTIVAL_LATITUDE="40.7128"
EXPO_PUBLIC_FESTIVAL_LONGITUDE="-74.0060"
EXPO_PUBLIC_FESTIVAL_TIMEZONE="America/New_York"

# API Configuration
EXPO_PUBLIC_API_URL="https://your-api.example.com/api/v1"

# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY="your-api-key"
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
EXPO_PUBLIC_FIREBASE_DATABASE_URL="https://your-project-default-rtdb.firebaseio.com"
EXPO_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
EXPO_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef"
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID="G-XXXXXXXXXX"

# Bundle Identifiers
EXPO_PUBLIC_IOS_BUNDLE_ID="com.yourcompany.yourfestival"
EXPO_PUBLIC_ANDROID_BUNDLE_ID="com.yourcompany.yourfestival"

# Feature Flags
EXPO_PUBLIC_ENABLE_MAP="true"
EXPO_PUBLIC_ENABLE_NOTIFICATIONS="true"
EXPO_PUBLIC_ENABLE_SCHEDULE="true"
EXPO_PUBLIC_ENABLE_CAMPSITES="true"
```

### 2. app.json Configuration

Alternatively, you can configure values in `mobile/app.json` under the `extra` section:

```json
{
  "expo": {
    "extra": {
      "festivalName": "Your Festival Name",
      "festivalSlug": "your-festival-slug",
      "apiUrl": "https://your-api.example.com/api/v1",
      "firebaseApiKey": "your-api-key",
      "firebaseProjectId": "your-project-id",
      // ... other config values
    }
  }
}
```

### 3. Theme Customization

To customize theme colors, you can either:

**Option A: Environment Variable (JSON)**
```bash
EXPO_PUBLIC_FESTIVAL_THEME='{"light":{"primary":"#2E4031","secondary":"#6BBF59",...},"dark":{...}}'
```

**Option B: Modify `mobile/src/config/festival.config.ts`**

Update the `defaultConfig.theme` object with your colors.

### 4. App Assets

Replace the following assets in `mobile/src/assets/images/`:
- `icon.png` - App icon
- `splash.png` - Splash screen
- `adaptive-icon.png` - Android adaptive icon
- `bf-logo-trans.png` - Logo used in navigation
- Any other festival-specific images

### 5. Build Configuration

Update `mobile/app.json`:
- Change `name` to your festival name
- Update `slug` to your festival slug
- Update `ios.bundleIdentifier` and `android.package` to your bundle IDs
- Update any permission descriptions that mention "Big Fam Festival"

## Backend Configuration

### 1. Environment Variables

Set these environment variables for the backend:

```bash
# Festival Information
FESTIVAL_NAME="Your Festival Name"
FESTIVAL_SLUG="your-festival-slug"
FESTIVAL_ID="your-festival-id"  # Optional, for single-tenant mode

# API Metadata
API_TITLE="Your Festival API"
API_DESCRIPTION="API for Your Festival App"
API_VERSION="1.0"

# Other existing environment variables
NODE_ENV=production
PORT=8080
JWT_SECRET=your-secret
GOOGLE_PROJECT_ID=your-project-id
STORAGE_BUCKET=your-bucket
# ... etc
```

### 2. Multi-Tenant Setup

For multi-tenant deployments:

1. Set up separate Firebase projects for each festival
2. Configure tenant middleware to extract festival ID from headers or query params
3. Update Firestore collections to include tenant/festival ID

## Build Process

### Mobile App

1. **Development Build:**
   ```bash
   cd mobile
   npm install
   EXPO_PUBLIC_FESTIVAL_NAME="Your Festival" npm start
   ```

2. **Production Build:**
   ```bash
   cd mobile
   # Set all environment variables
   eas build --platform all --profile production
   ```

### Backend

1. **Local Development:**
   ```bash
   cd backend
   npm install
   # Set environment variables in .env file
   npm run start:dev
   ```

2. **Production Deployment:**
   ```bash
   cd backend
   # Set environment variables in Cloud Run
   # Deploy using Terraform or gcloud
   ```

## Testing Your Configuration

1. **Verify Configuration Loading:**
   - Check that `festivalConfig` in `mobile/src/config/festival.config.ts` has your values
   - Verify API calls use the correct endpoint
   - Check that theme colors are applied

2. **Test Features:**
   - Verify schedule shows correct dates
   - Check that location/timezone is correct in countdown
   - Test that notifications work with your Firebase project
   - Verify map functionality (if enabled)

## Troubleshooting

### Configuration Not Loading

- Ensure environment variables are prefixed with `EXPO_PUBLIC_` for mobile
- Check that `app.json` extra section is properly formatted
- Verify that `Constants.expoConfig?.extra` is accessible

### Firebase Issues

- Ensure Firebase config values are correct
- Verify Firebase project has necessary services enabled
- Check that service account has proper permissions

### Build Issues

- Clear cache: `expo start -c`
- Delete `node_modules` and reinstall
- Check that all required environment variables are set

## Next Steps

After configuration:
1. Test the app thoroughly
2. Update documentation with festival-specific information
3. Deploy to staging environment
4. Perform user acceptance testing
5. Deploy to production

## Support

For issues or questions, refer to:
- `AUDIT_REPORT.md` for codebase overview
- `README.md` for general setup
- Configuration files in `mobile/src/config/` and `backend/src/config/`

