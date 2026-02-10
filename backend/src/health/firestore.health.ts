import { Injectable, Logger } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { FirestoreService } from '../config/firestore/firestore.service';

@Injectable()
export class FirestoreHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(FirestoreHealthIndicator.name);

  constructor(private readonly firestoreService: FirestoreService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Try to perform a simple operation on Firestore with timeout
      const db = this.firestoreService.db;

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('Firestore health check timeout')),
          5000,
        );
      });

      const healthCheckPromise = db.listCollections();

      await Promise.race([healthCheckPromise, timeoutPromise]);

      return this.getStatus(key, true);
    } catch (error) {
      this.logger.error(`Firestore health check failed: ${error.message}`);

      // Don't fail completely - return degraded status
      return this.getStatus(key, false, {
        message: error.message,
        status: 'degraded',
      });
    }
  }
}
