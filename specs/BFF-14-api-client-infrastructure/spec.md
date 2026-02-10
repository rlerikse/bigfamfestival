# API Client Infrastructure - Retroactive Specification

**Status**: ✅ Implemented (Retroactive Documentation)  
**Jira**: [BFF-14](https://eriksensolutions.atlassian.net/browse/BFF-14)  
**Created**: 2026-02-09  

---

## Overview

API Client Infrastructure provides centralized HTTP client configuration for the mobile app, including base URL management, authentication header injection, request/response interceptors, and error handling standardization.

---

## User Stories

### User Story 1 - Centralized API Configuration
**As a** mobile developer,  
**I want** a centralized API client,  
**So that** all API calls use consistent configuration.

**Acceptance Criteria** (Verified):
- [x] Single axios instance with base URL
- [x] Default headers (Content-Type)
- [x] Request timeout configuration

**Implementation**: `mobile/src/services/apiClient.ts:L13-L19`

### User Story 2 - Automatic Authentication
**As a** mobile developer,  
**I want** auth tokens automatically added to requests,  
**So that** I don't have to manually add them.

**Acceptance Criteria** (Verified):
- [x] Request interceptor adds Bearer token
- [x] Token retrieved from AsyncStorage
- [x] Works for all authenticated endpoints

**Implementation**: `mobile/src/services/apiClient.ts:L44-L53`

### User Story 3 - Token Refresh
**As a** user,  
**I want** my session to refresh automatically,  
**So that** I don't get logged out unexpectedly.

**Acceptance Criteria** (Verified):
- [x] 401 responses trigger token refresh
- [x] Original request is retried with new token
- [x] Only attempts refresh once per request

**Implementation**: `mobile/src/services/apiClient.ts:L72-L95`

### User Story 4 - Error Handling
**As a** mobile developer,  
**I want** standardized error handling,  
**So that** errors are consistent across the app.

**Acceptance Criteria** (Verified):
- [x] Network errors return clean error object
- [x] Response data is automatically unwrapped
- [x] Errors include helpful messages

**Implementation**: `mobile/src/services/apiClient.ts:L55-L100`

---

## Functional Requirements

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-001 | Centralized axios instance | ✅ | `apiClient.ts:L13-L19` |
| FR-002 | Auto-inject auth token | ✅ | `apiClient.ts:L44-L53` |
| FR-003 | Response data unwrapping | ✅ | `apiClient.ts:L57-L59` |
| FR-004 | Token refresh on 401 | ✅ | `apiClient.ts:L72-L95` |
| FR-005 | Network error handling | ✅ | `apiClient.ts:L62-L70` |
| FR-006 | Android emulator URL fix | ✅ | `apiClient.ts:L21-L38` |
| FR-007 | Request timeout | ✅ | `apiClient.ts:L18` |

---

## Configuration

### Base URL
```typescript
const apiClient = axios.create({
  baseURL: 'https://bigfam-api-production-292369452544.us-central1.run.app/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds
});
```

### Android Emulator Fix
For development, localhost needs to be replaced with `10.0.2.2` for Android emulator:

```typescript
if (Platform.OS === 'android' && API_URL.includes('localhost')) {
  const newUrl = API_URL.replace('localhost', '10.0.2.2');
  apiClient.defaults.baseURL = newUrl;
}
```

---

## Interceptor Flow

### Request Interceptor
```
┌──────────────┐     ┌─────────────────────┐     ┌──────────────┐
│  API Call    │────▶│  Request Interceptor │────▶│   Server     │
└──────────────┘     │  + Add Bearer Token  │     └──────────────┘
                     └─────────────────────┘
```

### Response Interceptor (Success)
```
┌──────────────┐     ┌─────────────────────┐     ┌──────────────┐
│   Server     │────▶│  Response Interceptor│────▶│  API Caller  │
└──────────────┘     │  Unwrap response.data│     └──────────────┘
```

### Response Interceptor (401 Error)
```
┌──────────────┐     ┌─────────────────────┐     ┌──────────────┐
│   Server     │────▶│  Response Interceptor│────▶│  Refresh     │
│   (401)      │     │  Detect 401          │     │  Token       │
└──────────────┘     └─────────────────────┘     └──────────────┘
                                                        │
                     ┌─────────────────────┐            │
                     │  Retry Original     │◀───────────┘
                     │  Request            │
                     └─────────────────────┘
```

---

## Error Response Format

### Network Error
```typescript
{
  message: 'Unable to connect to the server. Please check your internet connection.',
  isNetworkError: true,
  originalError: AxiosError
}
```

### API Error
```typescript
{
  message: 'Error message from server',
  status: 400,
  data: { /* error details */ }
}
```

---

## File Structure

```
mobile/src/services/
├── apiClient.ts      # Axios instance and interceptors
└── api.ts            # API endpoint definitions (optional)

mobile/src/config/
└── constants.ts      # API_URL and other constants
```

---

## Storage Keys Used

| Key | Description |
|-----|-------------|
| `accessToken` | JWT access token |
| `refreshToken` | Refresh token (if implemented) |

---

## Related Specifications

- [BFF-4 Authentication](../BFF-4-authentication/spec.md) - Token management
- All API-consuming features depend on this infrastructure
