import {
  Controller,
  Post,
  Delete,
  ForbiddenException,
  Get,
  Body,
  Param,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ScheduleService } from './schedule.service';
import {
  CreateScheduleItemDto,
  RemoveScheduleItemDto,
} from './interfaces/schedule.interface';
import { UsersService } from '../users/users.service';
// Auth handled by global FirebaseAuthGuard

@ApiTags('schedule')
@ApiBearerAuth()
@Controller('schedule')
export class ScheduleController {
  constructor(
    private readonly scheduleService: ScheduleService,
    private readonly usersService: UsersService,
  ) {}

  // Add event to user's schedule
  @Post()
  @ApiOperation({ summary: "Add event to current user's schedule" })
  @ApiResponse({ status: 201, description: 'Event added to schedule' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async addToSchedule(
    @Request() req,
    @Body() createScheduleItemDto: CreateScheduleItemDto,
  ) {
    return this.scheduleService.addToSchedule(
      req.user.id,
      createScheduleItemDto,
    );
  }

  // Remove an event by eventId path param
  @Delete(':eventId')
  @ApiOperation({ summary: "Remove event from current user's schedule" })
  @ApiParam({ name: 'eventId', description: 'ID of the event to remove' })
  @ApiResponse({ status: 200, description: 'Event removed from schedule' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found in schedule' })
  async removeFromSchedule(@Request() req, @Param('eventId') eventId: string) {
    const removeDto: RemoveScheduleItemDto = { event_id: eventId };
    await this.scheduleService.removeFromSchedule(req.user.id, removeDto);
    return { message: 'Event removed from schedule successfully' };
  }

  // Get current user's schedule (always accessible to the owner)
  @Get()
  @ApiOperation({ summary: "Get current user's schedule" })
  @ApiResponse({ status: 200, description: 'Returns list of scheduled events' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUserSchedule(@Request() req) {
    return this.scheduleService.getSchedule(req.user.id);
  }

  // Get another user's schedule — respects shareMySchedule preference
  @Get(':userId')
  @ApiOperation({ summary: "Get another user's schedule by user ID" })
  @ApiParam({ name: 'userId', description: 'ID of the user' })
  @ApiResponse({
    status: 200,
    description: 'Returns list of scheduled events for the user',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'User has made their schedule private' })
  async getUserSchedule(@Request() req, @Param('userId') userId: string) {
    // Owner can always view their own schedule
    if (req.user.id !== userId) {
      const targetUser = await this.usersService.findById(userId).catch(() => null);
      // If user doesn't exist or has opted out (shareMySchedule === false), deny
      if (!targetUser || targetUser.shareMySchedule === false) {
        throw new ForbiddenException('This user has made their schedule private');
      }
    }

    return this.scheduleService.getSchedule(userId);
  }
}
