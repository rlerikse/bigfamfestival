import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FirestoreService } from './firestore.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: FirestoreService,
      useFactory: (configService: ConfigService) => {
        return new FirestoreService(
          configService.get<string>('GOOGLE_PROJECT_ID'),
        );
      },
      inject: [ConfigService],
    },
  ],
  exports: [FirestoreService],
})
export class FirestoreModule {}
