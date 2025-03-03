import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { FirestoreService } from '../config/firestore/firestore.service';

@Injectable()
export class FirestoreHealthIndicator extends HealthIndicator {
  constructor(private readonly firestoreService: FirestoreService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Try to perform a simple operation on Firestore
      const db = this.firestoreService.db;
      await db.listCollections();

      return this.getStatus(key, true);
    } catch (error) {
      return this.getStatus(key, false, { message: error.message });
    }
  }
}
