# Release Checklist

Pre-release checklist for Big Fam Festival app. Follow these steps every time we bump versions.

---

## Version Bump Procedure

Every release should include all of the following:

### 1. Merge & Version
```bash
cd /Users/reg/.openclaw/workspace-bigfam/repo

# Merge dev → main
git checkout main
git merge dev -m "release: vX.Y.Z — description"
git push origin main

# Bump version in mobile/app.json
# - version: "X.Y.Z"
# - ios.buildNumber: increment (or use EAS remote auto-increment)
# - android.versionCode: increment (or use EAS remote auto-increment)
# Also bump mobile/package.json version

# Sync dev
git checkout dev && git merge main && git push origin dev
```

### 2. Update Docs
- [ ] **CHANGELOG.md** — Add new version section with Added/Fixed/Changed
- [ ] **README.md** — Update if features changed (SDK version, key features, project structure)
- [ ] **docs/PROJECT_STATUS.md** — Update current version, status, recent changes

### 3. Deploy Services
```bash
# Backend auto-deploys to Cloud Run from main via CI

# Admin panel
cd admin && npx vite build && npx firebase deploy --only hosting

# Firebase rules (if changed)
npx firebase deploy --only storage,firestore
```

### 4. Build & Submit to Stores
```bash
cd mobile

# Build both platforms (EAS handles version auto-increment remotely)
eas build --platform android --profile production --non-interactive --no-wait
eas build --platform ios --profile production --non-interactive --no-wait

# Monitor builds at:
# https://expo.dev/accounts/eriksensolutions/projects/bigfam-festival/builds

# Once builds complete, submit:
eas submit --platform ios --latest
eas submit --platform android --latest

# Or download manually:
# iOS: Upload .ipa via Transporter app → App Store Connect → Submit for Review
# Android: Upload .aab via Play Console → Release → Create new release
```

### 5. Post-Release
- [ ] Tag release in git: `git tag vX.Y.Z && git push --tags`
- [ ] Verify CI passed on main
- [ ] Verify admin panel live at https://bigfamfestival.web.app
- [ ] Verify backend healthy (Cloud Run)
- [ ] Monitor store review status

---

## Current Status

| Platform | Build | Submit | Status |
|----------|-------|--------|--------|
| **iOS** | `eas build --platform ios --profile production` | `eas submit` or Transporter | ✅ Working |
| **Android** | `eas build --platform android --profile production` | `eas submit` or Play Console | ✅ Working |

---

## Versioning Strategy

- **EAS Remote Versioning**: `appVersionSource: "remote"` with `autoIncrement: true`
- EAS auto-increments `buildNumber` (iOS) and `versionCode` (Android) on each build
- `app.json` values are ignored for actual builds but kept in sync for reference
- Semantic versioning: MAJOR.MINOR.PATCH
  - MAJOR: Breaking changes
  - MINOR: New features
  - PATCH: Bug fixes

---

## Account & Access

### iOS (Apple)
- Apple Developer Program: enrolled ($99/year)
- Apple ID: `eriksen.solutions@gmail.com`
- Team ID: `XQ353QHFF7`
- ASC App ID: `6752632634`
- Bundle ID: `com.eriksensolutions.bigfam`

### Android (Google)
- Google Play Developer account: created ($25)
- Package name: `com.eriksensolutions.bigfam`

---

## Key URLs
- **Expo Builds**: https://expo.dev/accounts/eriksensolutions/projects/bigfam-festival/builds
- **App Store Connect**: https://appstoreconnect.apple.com
- **Google Play Console**: https://play.google.com/console
- **Admin Panel**: https://bigfamfestival.web.app
- **Backend API**: https://bigfam-api-production-292369452544.us-central1.run.app/api/v1
- **GitHub**: https://github.com/rlerikse/bigfamfestival

---

## Key Files
| File | Purpose |
|------|---------|
| `mobile/app.json` | App configuration, version |
| `mobile/eas.json` | Build & submit profiles |
| `CHANGELOG.md` | Release history |
| `README.md` | Project overview |
| `docs/PROJECT_STATUS.md` | Current project status |
