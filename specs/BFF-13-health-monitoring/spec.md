# Health Check & Monitoring - Retroactive Specification

**Status**: ✅ Implemented (Retroactive Documentation)  
**Jira**: [BFF-13](https://eriksensolutions.atlassian.net/browse/BFF-13)  
**Created**: 2026-02-09  

---

## Overview

Health Check & Monitoring provides endpoints for infrastructure monitoring, including API health status and Firestore connectivity checks. These endpoints support load balancer health checks and service observability.

---

## User Stories

### User Story 1 - Health Check Endpoint
**As a** DevOps engineer,  
**I want** a health check endpoint,  
**So that** load balancers can verify service health.

**Acceptance Criteria** (Verified):
- [x] GET /health returns health status
- [x] Includes Firestore connectivity check
- [x] Returns graceful response even if Firestore fails

**Implementation**: `backend/src/health/health.controller.ts:L15-L42`

### User Story 2 - Readiness Check
**As a** DevOps engineer,  
**I want** a simple readiness endpoint,  
**So that** I can check if the service is accepting requests.

**Acceptance Criteria** (Verified):
- [x] GET /health/ready returns basic status
- [x] Does not depend on external services
- [x] Includes uptime information

**Implementation**: `backend/src/health/health.controller.ts:L44-L52`

---

## Functional Requirements

| ID | Requirement | Status | Implementation |
|----|-------------|--------|----------------|
| FR-001 | Health check endpoint | ✅ | `health.controller.ts:L15-L42` |
| FR-002 | Firestore connectivity check | ✅ | `firestore.health.ts` |
| FR-003 | Readiness endpoint | ✅ | `health.controller.ts:L44-L52` |
| FR-004 | Graceful degradation | ✅ | Try-catch in health check |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | Public | Full health check with dependencies |
| GET | `/health/ready` | Public | Simple readiness check |

### Response Examples

**GET /health** (Healthy)
```json
{
  "status": "ok",
  "info": {
    "firestore": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "firestore": {
      "status": "up"
    }
  }
}
```

**GET /health** (Degraded)
```json
{
  "status": "ok",
  "info": {
    "firestore": {
      "status": "down",
      "message": "Firestore check failed but service is starting"
    }
  },
  "error": {},
  "details": {
    "firestore": {
      "status": "down",
      "message": "Connection timeout"
    }
  }
}
```

**GET /health/ready**
```json
{
  "status": "ready",
  "timestamp": "2026-02-09T15:30:00.000Z",
  "uptime": 3600.5
}
```

---

## Implementation Details

### NestJS Terminus Integration
Uses `@nestjs/terminus` for standardized health checks:

```typescript
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private firestoreHealth: FirestoreHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.firestoreHealth.isHealthy('firestore'),
    ]);
  }
}
```

### Firestore Health Indicator
```typescript
@Injectable()
export class FirestoreHealthIndicator extends HealthIndicator {
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    // Attempt a simple Firestore operation
    // Return health status
  }
}
```

---

## File Structure

```
backend/src/health/
├── health.controller.ts        # HTTP endpoints
├── health.module.ts            # Module definition
└── firestore.health.ts         # Firestore health indicator
```

---

## Infrastructure Integration

### Cloud Run Health Checks
```yaml
# Configure in Cloud Run
startupProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10

livenessProbe:
  httpGet:
    path: /health
    port: 3000
  periodSeconds: 30
```

---

## Related Specifications

- Infrastructure/Terraform configuration uses these endpoints
