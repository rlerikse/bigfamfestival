import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { AdminService } from './admin.service';
import { AdminUpdateUserDto } from '../users/dto/admin-update-user.dto';
import { CreateEventDto } from '../auth/dto/create-event.dto';
import { UpdateEventDto } from '../auth/dto/update-event.dto';
import { CreateShiftDto } from '../shifts/dto/create-shift.dto';
import { UpdateShiftDto } from '../shifts/dto/update-shift.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Stats ──────────────────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Get admin dashboard stats' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics' })
  async getStats() {
    return this.adminService.getStats();
  }

  // ── User Management ────────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'List users with search, role filter, and pagination' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or email' })
  @ApiQuery({ name: 'role', required: false, description: 'Filter by role' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiResponse({ status: 200, description: 'Paginated user list' })
  async listUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.adminService.listUsers(search, role, page, limit);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user detail by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user (including role)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Updated user' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.adminService.updateUser(id, dto);
  }

  // ── Event Management ───────────────────────────────────────────────

  @Post('events')
  @ApiOperation({ summary: 'Create event (admin)' })
  @ApiResponse({ status: 201, description: 'Event created' })
  async createEvent(@Body() dto: CreateEventDto, @Request() req) {
    dto.createdBy = req.user.id;
    return this.adminService.createEvent(dto);
  }

  @Patch('events/:id')
  @ApiOperation({ summary: 'Update event (admin)' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event updated' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async updateEvent(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.adminService.updateEvent(id, dto);
  }

  @Delete('events/:id')
  @ApiOperation({ summary: 'Delete event (admin)' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event deleted' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async deleteEvent(@Param('id') id: string) {
    return this.adminService.deleteEvent(id);
  }

  // ── Shift Management ──────────────────────────────────────────────

  @Get('shifts')
  @ApiOperation({ summary: 'List shifts with optional date/role filter' })
  @ApiQuery({ name: 'date', required: false, description: 'Filter by date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'role', required: false, description: 'Filter by role' })
  @ApiResponse({ status: 200, description: 'List of shifts' })
  async listShifts(
    @Query('date') date?: string,
    @Query('role') role?: string,
  ) {
    return this.adminService.listShifts({ date, role });
  }

  @Post('shifts')
  @ApiOperation({ summary: 'Create a shift' })
  @ApiResponse({ status: 201, description: 'Shift created' })
  async createShift(@Body() dto: CreateShiftDto) {
    return this.adminService.createShift(dto);
  }

  @Patch('shifts/:id')
  @ApiOperation({ summary: 'Update a shift' })
  @ApiParam({ name: 'id', description: 'Shift ID' })
  @ApiResponse({ status: 200, description: 'Shift updated' })
  @ApiResponse({ status: 404, description: 'Shift not found' })
  async updateShift(
    @Param('id') id: string,
    @Body() dto: UpdateShiftDto,
  ) {
    return this.adminService.updateShift(id, dto);
  }

  @Delete('shifts/:id')
  @ApiOperation({ summary: 'Delete a shift' })
  @ApiParam({ name: 'id', description: 'Shift ID' })
  @ApiResponse({ status: 200, description: 'Shift deleted' })
  @ApiResponse({ status: 404, description: 'Shift not found' })
  async deleteShift(@Param('id') id: string) {
    return this.adminService.deleteShift(id);
  }

  // ── Schedule Management ────────────────────────────────────────────

  @Get('schedule/:userId')
  @ApiOperation({ summary: "Get any user's schedule (admin bypass)" })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: "User's schedule" })
  async getUserSchedule(@Param('userId') userId: string) {
    return this.adminService.getUserSchedule(userId);
  }

  @Put('schedule/:userId')
  @ApiOperation({ summary: "Set/replace a user's schedule" })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Schedule replaced' })
  async setUserSchedule(
    @Param('userId') userId: string,
    @Body() body: { eventIds: string[] },
  ) {
    return this.adminService.setUserSchedule(userId, body.eventIds);
  }

  @Post('schedule/:userId')
  @ApiOperation({ summary: "Add event to user's schedule" })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 201, description: 'Event added to schedule' })
  async addToUserSchedule(
    @Param('userId') userId: string,
    @Body() body: { eventId: string },
  ) {
    return this.adminService.addToUserSchedule(userId, body.eventId);
  }

  @Delete('schedule/:userId/:eventId')
  @ApiOperation({ summary: "Remove event from user's schedule" })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event removed from schedule' })
  async removeFromUserSchedule(
    @Param('userId') userId: string,
    @Param('eventId') eventId: string,
  ) {
    return this.adminService.removeFromUserSchedule(userId, eventId);
  }
}
