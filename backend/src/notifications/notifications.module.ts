import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { FirestoreModule } from '../config/firestore/firestore.module';
import { FirebaseAdminModule } from '../config/firebase/firebase-admin.module';

@Module({
  imports: [FirestoreModule, FirebaseAdminModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
