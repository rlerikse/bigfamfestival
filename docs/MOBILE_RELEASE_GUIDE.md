# Mobile Release Guide

Complete guide for building and releasing the Big Fam Festival app to iOS App Store and Google Play Store.

## Current Workflow Summary

| Platform | Build | Submit |
|----------|-------|--------|
| **iOS** | `eas build --platform ios --profile production` | Manual upload via Transporter/App Store Connect |
| **Android** | `eas build --platform android --profile production` | Manual upload via Play Console (closed testing completed) |

## Prerequisites

| Requirement | iOS | Android |
|-------------|-----|---------|
| Developer Account | Apple Developer Program ($99/year) | Google Play Developer ($25 one-time) |
| EAS CLI | `npm install -g eas-cli` | Same |
| Expo Account | Required | Required |

---

## Part 1: iOS Release

### 1.1 Apple Developer Setup

1. **Enroll in Apple Developer Program**
   - Visit [developer.apple.com](https://developer.apple.com)
   - Enroll as Individual or Organization ($99/year)
   - Wait for approval (usually 24-48 hours)

2. **Create App ID in Developer Portal**
   - Go to Certificates, Identifiers & Profiles
   - Create new Identifier → App IDs
   - Bundle ID: `com.eriksensolutions.bigfam`
   - Enable capabilities: Push Notifications, Associated Domains (if needed)

### 1.2 App Store Connect Setup

1. **Create App Listing**
   - Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - My Apps → (+) New App
   - Platform: iOS
   - Name: Big Fam Festival
   - Primary Language: English (U.S.)
   - Bundle ID: Select `com.eriksensolutions.bigfam`
   - SKU: `bigfam-festival-2026`

2. **App Information**
   - Category: Entertainment (Primary), Music (Secondary)
   - Content Rights: Confirm you own the content
   - Age Rating: Complete questionnaire (likely 4+)

3. **Prepare Metadata**
   - App Name (30 chars max)
   - Subtitle (30 chars max)
   - Description (4000 chars max)
   - Keywords (100 chars max, comma-separated)
   - Support URL
   - Marketing URL (optional)
   - Privacy Policy URL (required)

4. **Screenshots Required**
   | Device | Size | Quantity |
   |--------|------|----------|
   | iPhone 6.7" | 1290 x 2796 | 3-10 |
   | iPhone 6.5" | 1284 x 2778 | 3-10 |
   | iPhone 5.5" | 1242 x 2208 | 3-10 |
   | iPad 12.9" | 2048 x 2732 | 3-10 (if supporting iPad) |

### 1.3 iOS Signing (EAS Managed)

EAS handles signing automatically. Verify credentials:

```bash
cd mobile
eas credentials --platform ios
```

If you need to set up manually:
```bash
eas credentials --platform ios
# Choose: Set up a new distribution certificate
# Choose: Set up a new provisioning profile
```

### 1.4 Build iOS App

**Production Build:**
```bash
cd mobile
eas build --platform ios --profile production
```

This will:
- Use the production profile from `eas.json`
- Auto-increment build number
- Create an `.ipa` file for App Store

**Monitor build:** Check [expo.dev](https://expo.dev) dashboard

### 1.5 Submit to App Store

**Current Workflow: Manual Upload via Transporter**

1. Download `.ipa` from [Expo dashboard](https://expo.dev/accounts/eriksensolutions/projects/bigfam-festival/builds)
2. Open **Transporter** app (macOS) - download from Mac App Store if needed
3. Sign in with Apple ID: `eriksen.solutions@gmail.com`
4. Drag and drop `.ipa` file
5. Click **Deliver**

**Alternative: EAS Submit (Automated)**
```bash
eas submit --platform ios --profile production
```
Note: This uses credentials in `eas.json`:
- Apple ID: `eriksen.solutions@gmail.com`
- ASC App ID: `6752632634`
- Team ID: `XQ353QHFF7`

### 1.6 App Review

1. In App Store Connect, select the build
2. Add "What's New" text for this version
3. Answer export compliance questions
4. Submit for Review
5. Wait 24-48 hours (first submission may take longer)

---

## Part 2: Android Release

### 2.1 Google Play Closed Testing Requirement (IMPORTANT)

**Google requires all NEW apps to complete a 14-day closed testing period before production release.**

**Requirements:**
- Create a **Closed Testing** track
- Add **at least 20 testers** (email addresses)
- Testers must **opt-in** via the testing link
- App must be available for **14 continuous days**
- Then apply for **production access**

**Check Your Status:**
1. Go to [Play Console](https://play.google.com/console) → Big Fam Festival
2. Navigate to **Release** → **Production**
3. If you see "Start rollout to Production" - you're cleared!
4. If blocked, check **Testing** → **Closed testing** for status

**If testing expired or needs restart:**
1. Create new closed testing release
2. Re-invite 20+ testers
3. Wait 14 days
4. Apply for production access

### 2.2 Google Play Console Setup

1. **Create Developer Account** (if not done)
   - Go to [play.google.com/console](https://play.google.com/console)
   - Pay $25 registration fee
   - Complete identity verification

2. **Create App** (if not done)
   - All apps → Create app
   - App name: Big Fam Festival
   - Default language: English (United States)
   - App or game: App
   - Free or paid: Free
   - Accept declarations

### 2.3 Build Android App

**Production Build (AAB for Play Store):**
```bash
cd mobile
eas build --platform android --profile production
```

This creates an `.aab` (Android App Bundle) file.

### 2.4 Submit to Google Play (Manual - Current Workflow)

**Current Workflow: Manual Upload**

1. Download `.aab` from [Expo dashboard](https://expo.dev/accounts/eriksensolutions/projects/bigfam-festival/builds)
2. Go to [Play Console](https://play.google.com/console) → Big Fam Festival
3. Navigate to **Release** → **Production** (or **Closed testing** if not cleared yet)
4. Click **Create new release**
5. Upload `.aab` file
6. Add release notes
7. Review and **Start rollout**

### 2.5 Automated Submit (Optional - Requires Setup)

To enable `eas submit --platform android`:

**Create Service Account (`google-play-service-account.json`):**

1. **In Google Cloud Console:**
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Select/create project linked to your Play Console
   - Go to IAM & Admin → Service Accounts
   - Create Service Account:
     - Name: `eas-submit`
     - ID: `eas-submit`
   - Grant role: (skip for now)
   - Create key → JSON → Download
   - Rename to `google-play-service-account.json`
   - Move to `mobile/` directory

2. **In Google Play Console:**
   - Go to Setup → API access
   - Link your Google Cloud project
   - Under Service accounts, find `eas-submit`
   - Click "Manage Play Console permissions"
   - Grant permissions:
     - ✅ View app information and download bulk reports
     - ✅ Release to production, exclude devices, and use Play App Signing
     - ✅ Manage store presence
   - Apply to: This app only (or All apps)
   - Invite user

3. **Add to .gitignore:**
   ```
   google-play-service-account.json
   ```

4. **Then use:**
   ```bash
   eas submit --platform android --profile production
   ```

### 2.6 Review Process

- Google review takes 1-7 days (first submission longer)
- Check for policy violations in Play Console
- Monitor crash reports after release

---

## Part 3: Environment Configuration

### 3.1 Environment Files

Create these files in `mobile/`:

**`.env.staging`**
```bash
EXPO_PUBLIC_FESTIVAL_NAME="Big Fam Festival"
EXPO_PUBLIC_API_URL="https://bigfam-api-staging-XXXXX.us-central1.run.app/api/v1"
EXPO_PUBLIC_APP_ENV="staging"
# Firebase staging config
EXPO_PUBLIC_FIREBASE_API_KEY="your-staging-key"
EXPO_PUBLIC_FIREBASE_PROJECT_ID="bigfamfestival-staging"
# ... other staging values
```

**`.env.production`**
```bash
EXPO_PUBLIC_FESTIVAL_NAME="Big Fam Festival"
EXPO_PUBLIC_API_URL="https://bigfam-api-production-292369452544.us-central1.run.app/api/v1"
EXPO_PUBLIC_APP_ENV="production"
# Firebase production config
EXPO_PUBLIC_FIREBASE_API_KEY="your-production-key"
EXPO_PUBLIC_FIREBASE_PROJECT_ID="bigfamfestival"
# ... other production values
```

### 3.2 Current Credentials in eas.json

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "eriksen.solutions@gmail.com",
        "ascAppId": "6752632634",
        "appleTeamId": "XQ353QHFF7"
      },
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "production"
      }
    }
  }
}
```

---

## Part 4: Release Workflow

### 4.1 Pre-Release Checklist

```bash
# 1. Ensure clean git state
git status

# 2. Run tests
cd mobile && npm test

# 3. Verify environment
cat .env.production

# 4. Check credentials
eas credentials --platform ios
eas credentials --platform android
```

### 4.2 Build Both Platforms

```bash
# Build both simultaneously
eas build --platform all --profile production

# Or separately
eas build --platform ios --profile production
eas build --platform android --profile production
```

### 4.3 Submit Both Platforms

```bash
# Submit to both stores
eas submit --platform all --profile production

# Or separately
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

### 4.4 Post-Release

1. Monitor crash reports (Sentry, Play Console, App Store Connect)
2. Respond to user reviews
3. Track analytics
4. Prepare hotfix process if needed

---

## Part 5: Beta Testing

### 5.1 iOS TestFlight

1. Build with production profile
2. Upload to App Store Connect
3. In TestFlight tab:
   - Add internal testers (up to 100)
   - Or create external test group (up to 10,000)
4. Testers receive invite via email

### 5.2 Android Internal Testing

1. In Play Console: Testing → Internal testing
2. Create new release, upload `.aab`
3. Add testers by email
4. Share opt-in link

### 5.3 EAS Preview Builds

For internal testing without store submission:

```bash
# Build preview APK (Android)
eas build --platform android --profile preview

# Share download link with testers
```

---

## Part 6: Version Management

### 6.1 Version Strategy

- **version** (app.json): Marketing version shown to users (1.0.0, 1.1.0, 2.0.0)
- **buildNumber/versionCode**: Internal build number (auto-incremented by EAS)

### 6.2 Update Version

Edit `mobile/app.json`:
```json
{
  "expo": {
    "version": "1.1.0"
  }
}
```

Build numbers auto-increment with `"autoIncrement": true` in eas.json.

---

## Troubleshooting

### iOS Issues

**"No matching provisioning profile"**
```bash
eas credentials --platform ios
# Choose: Set up a new provisioning profile
```

**"App ID not found"**
- Verify bundle ID matches App Store Connect

### Android Issues

**"Service account not authorized"**
- Check Play Console API access permissions
- Verify service account has correct role

**"Version code already exists"**
- Build number must always increase
- Check `autoIncrement` is true in eas.json

### Build Failures

**Check logs:**
```bash
eas build:list
# Click on failed build for logs
```

**Clear cache:**
```bash
eas build --platform <ios|android> --clear-cache --profile production
```
