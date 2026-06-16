import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { UsersService } from '../users/users.service';
import { CreateProfileDto } from '../users/dto/create-profile.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Register a new user profile after Firebase Authentication signup.
   *
   * The client must first create a Firebase Auth account (email/password or SSO),
   * then call this endpoint with a valid Firebase ID token to create the
   * corresponding backend profile.
   *
   * This endpoint replaces the legacy POST /auth/register that was removed
   * during the Firebase Auth migration (BFF-50).
   */
  @Post('register')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new user profile (requires Firebase ID token)',
  })
  @ApiResponse({ status: 201, description: 'User profile created' })
  @ApiResponse({ status: 409, description: 'User profile already exists' })
  @ApiResponse({ status: 401, description: 'Invalid or missing Firebase token' })
  async register(@Request() req, @Body() createProfileDto: CreateProfileDto) {
    // Check if user already exists (by UID or email migration)
    const existing = await this.usersService
      .findById(req.user.id, req.user.email)
      .catch(() => null);
    if (existing) {
      throw new ConflictException('User profile already exists');
    }

    return this.usersService.createWithId(req.user.id, {
      name: createProfileDto.name,
      email: createProfileDto.email,
      phone: createProfileDto.phone,
      role: createProfileDto.role,
      profilePictureUrl: createProfileDto.profilePictureUrl,
    });
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile from Firebase token' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Request() req) {
    return req.user;
  }

  /**
   * Verify a Firebase ID token and return decoded user info.
   * This endpoint is used to validate Firebase tokens from the mobile app.
   */
  @UseGuards(FirebaseAuthGuard)
  @Get('verify')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify Firebase ID token' })
  @ApiResponse({
    status: 200,
    description: 'Token is valid',
    schema: {
      type: 'object',
      properties: {
        uid: { type: 'string', description: 'User ID' },
        email: { type: 'string', description: 'User email' },
        role: { type: 'string', description: 'User role (ADMIN, ATTENDEE)' },
        emailVerified: {
          type: 'boolean',
          description: 'Email verification status',
        },
        authProvider: {
          type: 'string',
          description: 'Authentication provider',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired token' })
  verifyToken(@Request() req) {
    return req.user;
  }
}
