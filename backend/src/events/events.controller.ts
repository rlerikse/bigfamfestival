import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
// Auth handled by global FirebaseAuthGuard + RolesGuard
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { EventsService } from './events.service';
import { CreateEventDto } from '../auth/dto/create-event.dto';
import { UpdateEventDto } from '../auth/dto/update-event.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('events')
@Controller('events')
export class EventsController {
  private readonly logger = new Logger(EventsController.name);

  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all events or filter by stage/date' })
  @ApiQuery({
    name: 'stage',
    required: false,
    description: 'Filter events by stage',
  })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'Filter events by date (YYYY-MM-DD)',
  })
  @ApiResponse({ status: 200, description: 'Returns a list of events' })
  async getAllEvents(
    @Query('stage') stage?: string,
    @Query('date') date?: string,
  ) {
    try {
      return await this.eventsService.findAll(stage, date);
    } catch (error) {
      this.logger.error('Failed to fetch events:', error.message || error);
      // Return empty array on Firestore failure rather than crashing
      // The mobile app has cache fallback — an empty 200 is better than a 500
      return [];
    }
  }

  @Get('stages')
  @Public()
  @ApiOperation({ summary: 'Get all unique stages' })
  @ApiResponse({ status: 200, description: 'Returns a list of unique stages' })
  async getStages() {
    return this.eventsService.getUniqueStages();
  }

  @Get('genres')
  @Public()
  @ApiOperation({ summary: 'Get all genres' })
  @ApiResponse({ status: 200, description: 'Returns a list of genres' })
  async getGenres() {
    try {
      const genres = await this.eventsService.getAllGenres();
      const result = genres.map((doc) => ({
        id: doc.id,
        tag: doc.tag,
      }));
      // Debug logging removed - use Pino logger if needed
      return result;
    } catch (error) {
      this.logger.error('Error fetching genres:', error);
      // Optionally, you can use NestJS's HttpException for more control
      throw new Error('Failed to fetch genres');
    }
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiResponse({ status: 200, description: 'Returns the event' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEventById(@Param('id') id: string) {
    return this.eventsService.findById(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new event (Admin only)' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  async createEvent(@Body() createEventDto: CreateEventDto, @Request() req) {
    // Set the creator ID to the user making the request
    return this.eventsService.create({
      ...createEventDto,
      createdBy: req.user.id,
    });
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update event by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Request() req,
  ) {
    // Admin can update any event
    return this.eventsService.update(id, updateEventDto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Partial update / move / resize a schedule block (Admin only). ' +
      'Send only changed fields (e.g. { endTime } to resize, ' +
      '{ stage, date, startTime, endTime } to move). Same overlap + festivalDay ' +
      'rules apply as PUT.',
  })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  @ApiResponse({ status: 400, description: 'Time conflict on stage' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async patchEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, updateEventDto);
  }

  @Post('backfill-schedule-fields')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Backfill festivalDay + blockType on existing events (Admin only, idempotent)',
  })
  @ApiResponse({ status: 201, description: 'Backfill summary' })
  async backfillScheduleFields() {
    return this.eventsService.backfillScheduleFields();
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete event by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async deleteEvent(@Param('id') id: string, @Request() req) {
    return this.eventsService.remove(id);
  }
}
