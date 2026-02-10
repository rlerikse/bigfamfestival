# Tech Stack - Big Fam Festival App

**Generated**: February 9, 2026  
**Source**: Package analysis and codebase inspection

---

## Overview

This is a **polyglot** repository containing:
- **Backend API** (NestJS + TypeScript)
- **Mobile App** (React Native + Expo)
- **Cloud Functions** (Firebase Functions)

---

## Backend Stack

### Runtime & Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20.x | Runtime |
| NestJS | ^10.0.0 | Backend framework |
| TypeScript | ^5.1.6 | Language |
| Express | via NestJS | HTTP server |

### Database & Storage
| Technology | Version | Purpose |
|------------|---------|---------|
| Google Cloud Firestore | ^6.5.0 | Primary database |
| Google Cloud Storage | ^6.10.1 | File storage |
| Firebase Admin | ^13.4.0 | Firebase SDK |

### Authentication & Security
| Technology | Version | Purpose |
|------------|---------|---------|
| Firebase Admin | ^13.4.0 | Firebase Auth token verification |
| Helmet | ^8.1.0 | Security headers |
| @nestjs/throttler | ^6.4.0 | Rate limiting |

> **Note**: As of BFF-50, authentication uses Firebase Auth. The backend validates Firebase ID tokens via `FirebaseAuthGuard`. Legacy Passport/JWT/bcrypt have been removed.

### API Documentation
| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS Swagger | ^7.0.3 | OpenAPI/Swagger docs |

### Validation & Transformation
| Technology | Version | Purpose |
|------------|---------|---------|
| class-validator | ^0.14.0 | DTO validation |
| class-transformer | ^0.5.1 | Object transformation |
| Joi | ^17.9.2 | Schema validation |

### Observability
| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS Terminus | ^10.0.1 | Health checks |
| nestjs-pino | ^3.2.0 | Logging |
| pino-http | ^8.3.3 | HTTP logging |
| pino-pretty | ^10.0.0 | Log formatting |

### Push Notifications
| Technology | Version | Purpose |
|------------|---------|---------|
| expo-server-sdk | ^3.15.0 | Expo push notifications |

### Utilities
| Technology | Version | Purpose |
|------------|---------|---------|
| axios | ^1.9.0 | HTTP client |
| rxjs | ^7.8.1 | Reactive extensions |
| csv-parser | ^3.2.0 | CSV parsing |

---

## Mobile Stack

### Runtime & Framework
| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.81.4 | Mobile framework |
| Expo | ~54.0.0 | Development platform |
| React | 19.1.0 | UI library |
| TypeScript | ^5.3.3 | Language |

### Navigation
| Technology | Version | Purpose |
|------------|---------|---------|
| React Navigation | ^6.1.6 | Navigation framework |
| @react-navigation/native-stack | ^6.9.12 | Native stack navigator |
| @react-navigation/bottom-tabs | ^6.5.7 | Tab navigator |

### State Management & Data Fetching
| Technology | Version | Purpose |
|------------|---------|---------|
| TanStack React Query | ^5.59.0 | Server state management |
| React Context | built-in | Client state |

### Storage & Security
| Technology | Version | Purpose |
|------------|---------|---------|
| AsyncStorage | ^2.2.0 | Unencrypted storage |
| expo-secure-store | ~15.0.7 | Encrypted storage |

### Authentication
| Technology | Version | Purpose |
|------------|---------|---------|
| Firebase | ^12.3.0 | Auth provider |
| @firebase/auth-compat | ^0.6.0 | Auth compatibility |

### Networking
| Technology | Version | Purpose |
|------------|---------|---------|
| axios | ^1.12.2 | HTTP client |
| @react-native-community/netinfo | ^11.4.1 | Network status |
| expo-network | ~8.0.7 | Network utilities |

### UI Components
| Technology | Version | Purpose |
|------------|---------|---------|
| @expo/vector-icons | ^15.0.2 | Icons |
| expo-linear-gradient | ~15.0.7 | Gradients |
| expo-image | ~3.0.8 | Image handling |
| lottie-react-native | ~7.3.1 | Animations |
| react-native-svg | 15.12.1 | SVG support |

### Push Notifications
| Technology | Version | Purpose |
|------------|---------|---------|
| expo-notifications | ~0.32.11 | Push notifications |
| expo-device | ~8.0.8 | Device info |

### Location & Maps
| Technology | Version | Purpose |
|------------|---------|---------|
| expo-location | ~19.0.7 | Location services |

---

## Cloud Functions Stack

### Runtime
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20 | Runtime |
| TypeScript | ^5.1.6 | Language |

### Firebase
| Technology | Version | Purpose |
|------------|---------|---------|
| firebase-admin | ^11.8.0 | Admin SDK |
| firebase-functions | ^5.1.0 | Functions framework |
| expo-server-sdk | ^3.15.0 | Push notifications |

---

## Development Tools

### Code Quality
| Tool | Backend | Mobile |
|------|---------|--------|
| ESLint | ^8.44.0 | ^8.42.0 |
| Prettier | ^2.8.8 | N/A |
| TypeScript | ^5.1.6 | ^5.3.3 |

### Testing
| Tool | Backend | Mobile |
|------|---------|--------|
| Jest | ^29.5.0 | ^29.5.0 |
| @testing-library/react-native | N/A | ^13.2.0 |
| @nestjs/testing | ^10.0.5 | N/A |
| supertest | ^6.3.3 | N/A |

### Build Tools
| Tool | Backend | Mobile |
|------|---------|--------|
| NestJS CLI | ^10.0.5 | N/A |
| Expo CLI | N/A | via expo |
| ts-node | via scripts | N/A |

---

## Infrastructure

### Hosting
- **Backend**: Google Cloud Run
- **Database**: Google Cloud Firestore
- **Storage**: Google Cloud Storage
- **Functions**: Firebase Cloud Functions

### IaC
- **Terraform** for infrastructure provisioning

---

## Version Constraints

### Node.js
- Backend: Compatible with Node.js 20.x
- Functions: Requires Node.js 20 exactly

### TypeScript
- Strict mode: **Not enabled** in backend
- `skipLibCheck: true` for faster builds
- `experimentalDecorators: true` for NestJS decorators

### React Native
- New Architecture: Not explicitly enabled
- Expo SDK 54 compatibility required

---

## Key Architectural Decisions

1. **NestJS over Express**: Provides structure, DI, and TypeScript-first approach
2. **Firestore over SQL**: Schemaless for flexibility, real-time capabilities
3. **Expo over bare RN**: Simplified development, managed updates
4. **TanStack Query over Redux**: Server-state focused, less boilerplate
5. **Firebase Auth over custom JWT**: Managed auth service, automatic token refresh (BFF-50)
6. **Pino over Winston**: Better performance, structured logging
