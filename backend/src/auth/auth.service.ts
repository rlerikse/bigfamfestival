import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';

/**
 * AuthService - Firebase Auth Migration (BFF-50)
 *
 * Authentication is now handled entirely by Firebase Auth SDK (client-side)
 * and Firebase Admin SDK (server-side token verification via FirebaseAuthGuard).
 *
 * This service retains user lookup utilities used by guards and controllers.
 * Legacy bcrypt/JWT operations have been removed.
 */
@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Find a user by their Firebase UID (used by FirebaseAuthGuard after token verification)
   */
  async findUserByFirebaseUid(uid: string) {
    return this.usersService.findById(uid);
  }

  /**
   * Find a user by email
   */
  async findUserByEmail(email: string) {
    return this.usersService.findByEmail(email);
  }
}
