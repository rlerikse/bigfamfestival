import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';

// Firebase Auth Guards (BFF-50)
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';

@Module({
  imports: [UsersModule, ConfigModule],
  controllers: [AuthController],
  providers: [AuthService, FirebaseAuthGuard],
  exports: [AuthService, FirebaseAuthGuard],
})
export class AuthModule {}
