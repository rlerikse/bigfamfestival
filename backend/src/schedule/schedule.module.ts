import { Module } from '@nestjs/common';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { FirestoreModule } from '../config/firestore/firestore.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [FirestoreModule, EventsModule],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
