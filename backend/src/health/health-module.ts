import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { FirestoreHealthIndicator } from './firestore.health';
import { FirestoreModule } from '../config/firestore/firestore.module';

@Module({
  imports: [
    TerminusModule,
    FirestoreModule,
  ],
  controllers: [HealthController],
  providers: [FirestoreHealthIndicator],
})
export class HealthModule {}
