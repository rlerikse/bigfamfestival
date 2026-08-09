import { Module } from '@nestjs/common';
import { MapController } from './map.controller';
import { MapService } from './map.service';
import { FirestoreModule } from '../config/firestore/firestore.module';

@Module({
  imports: [FirestoreModule],
  controllers: [MapController],
  providers: [MapService],
})
export class MapModule {}
