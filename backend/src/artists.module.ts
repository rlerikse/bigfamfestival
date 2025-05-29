import { Module } from '@nestjs/common';
import { ArtistsService } from './artists/artists.service';
import { ArtistsController } from './artists/artists.controller';
import { FirestoreModule } from './config/firestore/firestore.module';

@Module({
  imports: [FirestoreModule],
  controllers: [ArtistsController],
  providers: [ArtistsService],
  exports: [ArtistsService],
})
export class ArtistsModule {}
