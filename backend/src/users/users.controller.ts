import {
  Body,
  ConflictException,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
// Auth handled by global FirebaseAuthGuard + RolesGuard
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { UsersService } from './users.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create user profile after Firebase registration' })
  @ApiResponse({ status: 201, description: 'User profile created' })
  @ApiResponse({ status: 409, description: 'User profile already exists' })
  async createProfile(@Request() req, @Body() createProfileDto: CreateProfileDto) {
    // Check if user already exists
    const existing = await this.usersService.findById(req.user.id).catch(() => null);
    if (existing) {
      throw new ConflictException('User profile already exists');
    }

    return this.usersService.createWithId(req.user.id, {
      name: createProfileDto.name,
      email: createProfileDto.email,
      phone: createProfileDto.phone,
      role: createProfileDto.role,
    });
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns the user profile' })
  async getProfile(@Request() req) {
    return this.usersService.findById(req.user.id);
  }

  @Put('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Updates the user profile' })
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  @Put('push-token')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update push notification token' })
  @ApiResponse({ status: 200, description: 'Updates the user push token' })
  async updatePushToken(@Request() req, @Body() { token }: { token: string }) {
    return this.usersService.updatePushToken(req.user.id, token);
  }

  @Put('notifications')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable/disable push notifications' })
  @ApiResponse({ status: 200, description: 'Updates notification preferences' })
  async toggleNotifications(
    @Request() req,
    @Body() { enabled }: { enabled: boolean },
  ) {
    return this.usersService.toggleNotifications(req.user.id, enabled);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'Returns the user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Request() req, @Param('id') id: string) {
    // Admins and staff can get any user, others can only get themselves
    if (
      req.user.id !== id &&
      req.user.role !== Role.ADMIN &&
      req.user.role !== Role.STAFF
    ) {
      throw new UnauthorizedException(
        'You are not authorized to view this user',
      );
    }

    return this.usersService.findById(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Update user by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Updates the user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }
}
