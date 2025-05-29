import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import {
  CreateScheduleItemDto,
  RemoveScheduleItemDto,
} from './interfaces/schedule.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('schedule')
@UseGuards(JwtAuthGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  // Add event to user's schedule
  @Post()
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
  async removeFromSchedule(@Request() req, @Param('eventId') eventId: string) {
    const removeDto: RemoveScheduleItemDto = { event_id: eventId };
    await this.scheduleService.removeFromSchedule(req.user.id, removeDto);
    return { message: 'Event removed from schedule successfully' };
  }

  // Get current user's schedule
  @Get()
  async getCurrentUserSchedule(@Request() req) {
    return this.scheduleService.getSchedule(req.user.id);
  }

  // Get another user's schedule by userId param
  @Get(':userId')
  async getUserSchedule(@Param('userId') userId: string) {
    return this.scheduleService.getSchedule(userId);
  }
}
