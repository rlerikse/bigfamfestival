import { Module } from '@nestjs/common';
import { NotificationsDebugController } from './notifications-debug.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [NotificationsDebugController],
})
export class DebugModule {}
