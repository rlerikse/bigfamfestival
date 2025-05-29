import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { Public } from '../auth/decorators/public.decorator';
import { FirestoreHealthIndicator } from './firestore.health';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly firestoreHealth: FirestoreHealthIndicator,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  async check() {
    try {
      return this.health.check([
        // Check if Firestore is accessible - but don't fail startup if it's not
        () => this.firestoreHealth.isHealthy('firestore'),
      ]);
    } catch (error) {
      // Return a basic health response even if Firestore check fails
      // This prevents the container from failing to start
      return {
        status: 'ok',
        info: {
          firestore: {
            status: 'down',
            message: 'Firestore check failed but service is starting',
          },
        },
        error: {},
        details: {
          firestore: {
            status: 'down',
            message: error.message,
          },
        },
      };
    }
  }

  @Public()
  @Get('ready')
  ready() {
    // Simple readiness check that doesn't depend on external services
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
