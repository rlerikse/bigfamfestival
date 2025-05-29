import { Module } from '@nestjs/common';
import { CampsitesController } from './campsites.controller';
import { CampsitesService } from './campsites.service';
import { FirestoreModule } from '../config/firestore/firestore.module'; // Ensure FirestoreModule is available

@Module({
  imports: [FirestoreModule], // Import FirestoreModule to use FirestoreService
  controllers: [CampsitesController],
  providers: [CampsitesService],
})
export class CampsitesModule {}
