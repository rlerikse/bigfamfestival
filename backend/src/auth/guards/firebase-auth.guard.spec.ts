import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import * as admin from 'firebase-admin';

// Mock firebase-admin
jest.mock('firebase-admin', () => ({
  auth: jest.fn(),
}));

describe('FirebaseAuthGuard', () => {
  let guard: FirebaseAuthGuard;
  let reflector: Reflector;
  let mockVerifyIdToken: jest.Mock;

  const createMockExecutionContext = (
    authHeader?: string,
    isPublic = false,
  ): ExecutionContext => {
    const mockRequest = {
      headers: {
        authorization: authHeader,
      },
      user: null,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    mockVerifyIdToken = jest.fn();
    (admin.auth as jest.Mock).mockReturnValue({
      verifyIdToken: mockVerifyIdToken,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirebaseAuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn().mockReturnValue(false),
          },
        },
      ],
    }).compile();

    guard = module.get<FirebaseAuthGuard>(FirebaseAuthGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should allow access to public routes', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const context = createMockExecutionContext(undefined, true);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should reject request without token', async () => {
      const context = createMockExecutionContext();

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject request without Bearer prefix', async () => {
      const context = createMockExecutionContext('Basic sometoken');

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should accept valid Firebase token', async () => {
      const mockDecodedToken = {
        uid: 'user123',
        email: 'test@example.com',
        role: 'ATTENDEE',
        email_verified: true,
      };
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);

      const context = createMockExecutionContext('Bearer valid-firebase-token');
      const request = context.switchToHttp().getRequest();

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.user).toEqual({
        sub: 'user123',
        uid: 'user123',
        email: 'test@example.com',
        role: 'ATTENDEE',
        emailVerified: true,
        authProvider: 'firebase',
      });
    });

    it('should default role to ATTENDEE if not in custom claims', async () => {
      const mockDecodedToken = {
        uid: 'user123',
        email: 'test@example.com',
        email_verified: true,
        // No role field
      };
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);

      const context = createMockExecutionContext('Bearer valid-token');
      const request = context.switchToHttp().getRequest();

      await guard.canActivate(context);

      expect(request.user.role).toBe('ATTENDEE');
    });

    it('should reject expired token with specific error', async () => {
      const error = new Error('Token expired');
      (error as any).code = 'auth/id-token-expired';
      mockVerifyIdToken.mockRejectedValue(error);

      const context = createMockExecutionContext('Bearer expired-token');

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Token has expired',
      );
    });

    it('should reject revoked token with specific error', async () => {
      const error = new Error('Token revoked');
      (error as any).code = 'auth/id-token-revoked';
      mockVerifyIdToken.mockRejectedValue(error);

      const context = createMockExecutionContext('Bearer revoked-token');

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Token has been revoked',
      );
    });

    it('should reject malformed token with specific error', async () => {
      const error = new Error('Invalid token');
      (error as any).code = 'auth/argument-error';
      mockVerifyIdToken.mockRejectedValue(error);

      const context = createMockExecutionContext('Bearer malformed-token');

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Invalid token format',
      );
    });

    it('should reject unknown error with generic message', async () => {
      const error = new Error('Unknown error');
      mockVerifyIdToken.mockRejectedValue(error);

      const context = createMockExecutionContext('Bearer bad-token');

      await expect(guard.canActivate(context)).rejects.toThrow(
        'Invalid authentication token',
      );
    });
  });
});
