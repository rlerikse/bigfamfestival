import { forwardRef, Module } from '@nestjs/common';
import { ArtistsService } from './artists.service';
import { ArtistsController } from './artists.controller';
import { FirestoreModule } from '../config/firestore/firestore.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [FirestoreModule, forwardRef(() => EventsModule)],
  controllers: [ArtistsController],
  providers: [ArtistsService],
  exports: [ArtistsService],
})
export class ArtistsModule {}
