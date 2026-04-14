import { Module } from '@nestjs/common';
import { ShiftsService } from './shifts.service';
import { FirestoreModule } from '../config/firestore/firestore.module';

@Module({
  imports: [FirestoreModule],
  providers: [ShiftsService],
  exports: [ShiftsService],
})
export class ShiftsModule {}
