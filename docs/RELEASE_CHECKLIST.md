# Release Checklist

Pre-release checklist for Big Fam Festival app deployment to iOS App Store and Google Play Store.

---

## Current Workflow

| Platform | Build | Submit | Status |
|----------|-------|--------|--------|
| **iOS** | `eas build --platform ios --profile production` | Manual via Transporter | ✅ Working |
| **Android** | `eas build --platform android --profile production` | Manual via Play Console | ⚠️ Check closed testing status |

---

## Status Summary

| Category | iOS | Android |
|----------|-----|---------|
| Developer Account | ✅ Configured | ✅ Configured |
| Store Listing | ✅ Exists (ASC ID: 6752632634) | ⚠️ Verify in Play Console |
| Build Config | ✅ Ready | ✅ Ready |
| Submit Config | ✅ Manual upload | ⚠️ Manual upload (service account optional) |
| Signing | ✅ EAS Managed | ✅ EAS Managed |
| Closed Testing | N/A | ⚠️ **Check if 14-day period complete** |

---

## 1. Account & Access

### iOS (Apple)
- [x] Apple Developer Program enrolled ($99/year)
- [x] App Store Connect access confirmed
- [x] Apple ID in eas.json: `eriksen.solutions@gmail.com`
- [x] Team ID in eas.json: `XQ353QHFF7`
- [x] ASC App ID in eas.json: `6752632634`

### Android (Google)
- [x] Google Play Developer account created ($25)
- [x] Google Play Console access confirmed
- [ ] **⚠️ CHECK: Is closed testing 14-day period complete?**
  - Go to Play Console → Big Fam Festival → Release → Production
  - If "Start rollout to Production" is available → You're cleared!
  - If blocked → Check Testing → Closed testing status
- [ ] (Optional) Create `mobile/google-play-service-account.json` for automated submit

---

## 2. Store Listings

### iOS App Store Connect
- [x] App created in App Store Connect (ID: 6752632634)
- [x] App name: Big Fam Festival
- [x] Bundle ID: `com.eriksensolutions.bigfam`
- [ ] Verify current app metadata is up to date for new version

### Google Play Console
- [x] App created in Play Console
- [x] Package name: `com.eriksensolutions.bigfam`
- [ ] Verify current store listing is up to date for new version
- [ ] **Check closed testing status** (see Section 1)

---

## 3. Build & Deploy Quick Reference

### iOS Deployment (Current Workflow)
```bash
# 1. Build
cd mobile
eas build --platform ios --profile production

# 2. Wait for build to complete on expo.dev

# 3. Download .ipa from Expo dashboard
# https://expo.dev/accounts/eriksensolutions/projects/bigfam-festival/builds

# 4. Upload via Transporter app (macOS)
# - Open Transporter
# - Sign in as eriksen.solutions@gmail.com
# - Drag & drop .ipa
# - Click Deliver

# 5. Go to App Store Connect
# - Select build
# - Add "What's New" notes
# - Submit for Review
```

### Android Deployment (Current Workflow)
```bash
# 1. Build
cd mobile
eas build --platform android --profile production

# 2. Wait for build to complete on expo.dev

# 3. Download .aab from Expo dashboard
# https://expo.dev/accounts/eriksensolutions/projects/bigfam-festival/builds

# 4. Go to Google Play Console
# - Release → Production (or Closed testing if not cleared)
# - Create new release
# - Upload .aab
# - Add release notes
# - Start rollout
```

---

## 4. Pre-Build Checks

### Code
- [ ] All tests pass: `npm test`
- [ ] No lint errors: `npm run lint`
- [ ] Version number updated in `app.json` if needed
- [ ] Release notes prepared

### Credentials
```bash
# Verify credentials are set up
eas credentials --platform ios
eas credentials --platform android
```
- [ ] iOS credentials valid
- [ ] Android credentials valid

---

## 5. Post-Submission

### iOS
- [ ] Build appears in App Store Connect
- [ ] Submitted for App Review
- [ ] Monitor review status (24-48 hours typical)

### Android
- [ ] Build uploaded to Play Console
- [ ] Release rolled out (or closed testing if needed)
- [ ] Monitor for policy issues

---

## Blocking Issues

| Priority | Issue | Action |
|----------|-------|--------|
| 🟡 P1 | Android closed testing status unknown | Check Play Console → Release → Production |
| 🟢 P2 | No automated Android submit | Optional: Create google-play-service-account.json |

---

## Quick Reference

### Key URLs
- **Expo Builds**: https://expo.dev/accounts/eriksensolutions/projects/bigfam-festival/builds
- **App Store Connect**: https://appstoreconnect.apple.com
- **Google Play Console**: https://play.google.com/console

### Key Credentials (eas.json)
```json
{
  "ios": {
    "appleId": "eriksen.solutions@gmail.com",
    "ascAppId": "6752632634",
    "appleTeamId": "XQ353QHFF7"
  }
}
```

### Key Files
| File | Purpose |
|------|---------|
| `mobile/app.json` | App configuration, version |
| `mobile/eas.json` | Build & submit profiles |
| `mobile/google-services.json` | Android Firebase config |
| `mobile/GoogleService-Info.plist` | iOS Firebase config |
