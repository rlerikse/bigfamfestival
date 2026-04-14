import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { FirestoreModule } from '../config/firestore/firestore.module';
import { UsersModule } from '../users/users.module';
import { EventsModule } from '../events/events.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ShiftsModule } from '../shifts/shifts.module';
import { ScheduleModule } from '../schedule/schedule.module';

@Module({
  imports: [
    FirestoreModule,
    UsersModule,
    EventsModule,
    NotificationsModule,
    ShiftsModule,
    ScheduleModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
