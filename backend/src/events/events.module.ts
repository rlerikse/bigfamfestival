import { forwardRef, Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { FirestoreModule } from '../config/firestore/firestore.module';
import { ArtistsModule } from '../artists/artists.module';

@Module({
  imports: [FirestoreModule, forwardRef(() => ArtistsModule)],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
