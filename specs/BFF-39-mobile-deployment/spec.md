# BFF-39: Mobile Deployment & Release

**Epic**: [BFF-39](https://eriksensolutions.atlassian.net/browse/BFF-39)  
**Status**: 60% Complete  
**Created**: 2026-02-10  
**Version**: 1.0  

---

## Overview

End-to-end mobile application deployment pipeline for the Big Fam Festival app, enabling releases to iOS App Store and Android Google Play Store with build automation, credential management, and beta testing workflows.

## Business Context

### Problem Statement
The Big Fam Festival mobile app requires a robust, repeatable deployment process to:
- Release updates to iOS and Android app stores
- Manage signing credentials securely
- Enable beta testing before production releases
- Automate builds to reduce manual effort and errors

### Goals
1. Establish working iOS and Android build/submission pipelines
2. Document all processes for team knowledge transfer
3. Enable automated submissions where possible
4. Support beta testing for pre-release validation

### Success Criteria
- [ ] Production builds successfully upload to both app stores
- [ ] iOS app passes App Store Review
- [ ] Android app passes Google Play policy review
- [ ] Beta testers can install and test pre-release builds
- [ ] CI/CD pipeline triggers builds on release branches

---

## Scope

### In Scope
| Area | Description |
|------|-------------|
| EAS Configuration | Build profiles for development, preview, and production |
| iOS Distribution | App Store Connect setup, signing, submission via Transporter |
| Android Distribution | Google Play Console setup, signing, submission |
| Beta Testing | TestFlight (iOS) and Internal Testing (Android) workflows |
| CI/CD | GitHub Actions workflow for automated builds |
| Documentation | Release guides and checklists |

### Out of Scope
- OTA updates via EAS Update (future enhancement)
- Automated rollback strategies
- A/B testing framework
- App monetization/in-app purchases

---

## User Scenarios & Stories

### Completed Stories ✅

#### M.1: EAS Build Configuration ([BFF-40](https://eriksensolutions.atlassian.net/browse/BFF-40))
Configure Expo Application Services for multi-environment builds.

**Implementation:**
- `mobile/eas.json` with development, preview, and production profiles
- Auto-increment build numbers enabled
- Node version pinned to 20.19.4
- Platform-specific configurations (iOS m-medium resource, Android app-bundle)

#### M.2: iOS Developer Account & Signing ([BFF-41](https://eriksensolutions.atlassian.net/browse/BFF-41))
Apple Developer Program enrollment and code signing setup.

**Implementation:**
- Apple Developer Program enrolled
- Bundle ID: `com.eriksensolutions.bigfam`
- App Store Connect listing (ASC ID: 6752632634)
- Team ID: XQ353QHFF7
- EAS-managed signing credentials

#### M.3: Android Developer Account & Signing ([BFF-42](https://eriksensolutions.atlassian.net/browse/BFF-42))
Google Play Developer account and app signing configuration.

**Implementation:**
- Google Play Developer account created
- Package name: `com.eriksensolutions.bigfam`
- Play App Signing enrolled
- EAS-managed signing credentials

#### M.4: Manual iOS Submission Workflow ([BFF-43](https://eriksensolutions.atlassian.net/browse/BFF-43))
Documented workflow for iOS App Store submissions.

**Implementation:**
- Build via `eas build --platform ios --profile production`
- Download .ipa from Expo dashboard
- Upload via Transporter app (macOS)
- Submit for App Review in App Store Connect

#### M.5: Manual Android Submission Workflow ([BFF-44](https://eriksensolutions.atlassian.net/browse/BFF-44))
Documented workflow for Google Play Store submissions.

**Implementation:**
- Build via `eas build --platform android --profile production`
- Download .aab from Expo dashboard
- Upload via Google Play Console
- Create release in Production or Closed testing track

---

### Remaining Stories ⏳

#### M.6: Android Closed Testing Completion ([BFF-45](https://eriksensolutions.atlassian.net/browse/BFF-45))
Complete Google Play's mandatory 14-day closed testing requirement.

**Requirements:**
- [ ] Create/verify closed testing track
- [ ] Add 20+ testers
- [ ] Wait 14 continuous days
- [ ] Verify production access unlocked

#### M.7: Google Play Service Account ([BFF-46](https://eriksensolutions.atlassian.net/browse/BFF-46))
Enable automated Android submissions via `eas submit`.

**Requirements:**
- [ ] Create service account in Google Cloud Console
- [ ] Generate JSON key file
- [ ] Configure Play Console API access
- [ ] Add to .gitignore
- [ ] Test automated submission

#### M.8: Environment Configuration Files ([BFF-47](https://eriksensolutions.atlassian.net/browse/BFF-47))
Create environment-specific configuration for staging and production.

**Requirements:**
- [ ] Create `.env.staging` with staging API/Firebase config
- [ ] Create `.env.production` with production API/Firebase config
- [ ] Update build profiles to reference env files

#### M.9: Beta Testing Workflow ([BFF-48](https://eriksensolutions.atlassian.net/browse/BFF-48))
Establish beta testing processes for both platforms.

**Requirements:**
- [ ] Configure TestFlight for iOS beta testing
- [ ] Configure Internal Testing track for Android
- [ ] Document beta tester onboarding
- [ ] Test EAS preview builds for quick distribution

#### M.10: CI/CD Build Automation ([BFF-49](https://eriksensolutions.atlassian.net/browse/BFF-49))
Automate mobile builds via GitHub Actions.

**Requirements:**
- [ ] Create `.github/workflows/mobile-build.yml`
- [ ] Run tests before builds
- [ ] Trigger EAS builds on release branches
- [ ] Configure required secrets (EXPO_TOKEN, etc.)

---

## Technical Architecture

### Build Pipeline

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Source Code   │────▶│    EAS Build    │────▶│  App Stores     │
│   (GitHub)      │     │  (Expo Cloud)   │     │  (iOS/Android)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       ▼                       │
        │               ┌─────────────────┐             │
        │               │   Artifacts     │             │
        │               │  (.ipa/.aab)    │             │
        │               └─────────────────┘             │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  CI/CD Tests    │     │  Manual/Auto    │     │  Store Review   │
│  (npm test)     │     │   Submit        │     │  (Apple/Google) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Key Configuration Files

| File | Purpose |
|------|---------|
| `mobile/eas.json` | EAS build & submit configuration |
| `mobile/app.json` | Expo app configuration |
| `mobile/.env.*` | Environment-specific variables |
| `.github/workflows/mobile-build.yml` | CI/CD automation |

### Credentials Management

| Platform | Credential | Storage |
|----------|-----------|---------|
| iOS | Distribution Certificate | EAS Managed |
| iOS | Provisioning Profile | EAS Managed |
| iOS | Apple ID | `eas.json` |
| Android | Upload Key | EAS Managed |
| Android | Service Account | `google-play-service-account.json` (gitignored) |

---

## Implementation Summary

### Completed Components

| Component | Location | Description |
|-----------|----------|-------------|
| EAS Config | `mobile/eas.json` | Build profiles for all environments |
| iOS Credentials | EAS/Apple | Signing managed via EAS |
| Android Credentials | EAS/Google | Signing managed via EAS |
| Release Guide | `docs/MOBILE_RELEASE_GUIDE.md` | Complete release documentation |
| Checklist | `docs/RELEASE_CHECKLIST.md` | Pre-release validation |

### Pending Implementation

| Component | Story | Priority |
|-----------|-------|----------|
| Android Closed Testing | BFF-45 | P1 - Blocking production |
| Service Account | BFF-46 | P2 - Enables automation |
| Environment Files | BFF-47 | P2 - Required for multi-env |
| Beta Testing | BFF-48 | P2 - Pre-release validation |
| CI/CD | BFF-49 | P3 - Automation enhancement |

---

## Related Documentation

- [MOBILE_RELEASE_GUIDE.md](../../docs/MOBILE_RELEASE_GUIDE.md) - Complete release workflow
- [RELEASE_CHECKLIST.md](../../docs/RELEASE_CHECKLIST.md) - Pre-release validation
- [DEVELOPMENT_SETUP.md](../../mobile/DEVELOPMENT_SETUP.md) - Local development setup

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-10 | AI Assistant | Initial spec created from existing implementation |
