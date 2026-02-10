import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as admin from 'firebase-admin';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard that validates Firebase ID tokens for authentication.
 *
 * Extracts the Bearer token from Authorization header, verifies it with
 * Firebase Admin SDK, and attaches the decoded user to the request.
 *
 * @example
 * ```typescript
 * @UseGuards(FirebaseAuthGuard)
 * @Controller('protected')
 * export class ProtectedController {}
 * ```
 */
@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.debug('No token provided in request');
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);

      // Attach decoded Firebase token info to request
      request.user = {
        id: decodedToken.uid,
        sub: decodedToken.uid,
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role || 'ATTENDEE', // Custom claim for role
        emailVerified: decodedToken.email_verified,
        authProvider: 'firebase',
      };

      this.logger.debug(`Firebase token verified for user ${decodedToken.uid}`);
      return true;
    } catch (error) {
      this.logger.debug(`Firebase token verification failed: ${error.message}`);

      // Provide specific error messages without leaking sensitive info
      if (error.code === 'auth/id-token-expired') {
        throw new UnauthorizedException('Token has expired');
      }
      if (error.code === 'auth/id-token-revoked') {
        throw new UnauthorizedException('Token has been revoked');
      }
      if (error.code === 'auth/argument-error') {
        throw new UnauthorizedException('Invalid token format');
      }

      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
