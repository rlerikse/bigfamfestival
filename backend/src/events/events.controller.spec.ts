import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Role } from '../auth/enums/role.enum';

describe('EventsController', () => {
  let controller: EventsController;
  let service: EventsService;

  // Mock data
  const mockEvent = {
    id: 'event-id-1',
    name: 'Test Event',
    stage: 'Main Stage',
    date: '2025-06-20',
    startTime: '19:00',
    endTime: '21:00',
    artists: ['artist-id-1'],
    createdBy: 'admin-id-1',
  };

  const mockCreateEventDto = {
    name: 'New Event',
    stage: 'Main Stage',
    date: '2025-06-21',
    startTime: '19:00',
    endTime: '21:00',
    artists: ['artist-id-1'],
  };

  const mockUpdateEventDto = {
    name: 'Updated Event',
  };

  // Create a mock EventsService
  const mockEventsService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByArtist: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    service = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllEvents', () => {
    it('should return all events when no filters are provided', async () => {
      const events = [mockEvent];
      mockEventsService.findAll.mockResolvedValue(events);

      const result = await controller.getAllEvents();
      expect(result).toEqual(events);
      expect(mockEventsService.findAll).toHaveBeenCalledWith(
        undefined,
        undefined,
      );
    });

    it('should filter events by stage', async () => {
      const stage = 'Main Stage';
      const events = [mockEvent];
      mockEventsService.findAll.mockResolvedValue(events);

      const result = await controller.getAllEvents(stage);
      expect(result).toEqual(events);
      expect(mockEventsService.findAll).toHaveBeenCalledWith(stage, undefined);
    });

    it('should filter events by date', async () => {
      const date = '2025-06-20';
      const events = [mockEvent];
      mockEventsService.findAll.mockResolvedValue(events);

      const result = await controller.getAllEvents(undefined, date);
      expect(result).toEqual(events);
      expect(mockEventsService.findAll).toHaveBeenCalledWith(undefined, date);
    });
  });

  describe('getEventById', () => {
    it('should return an event by ID', async () => {
      const eventId = 'event-id-1';
      mockEventsService.findById.mockResolvedValue(mockEvent);

      const result = await controller.getEventById(eventId);
      expect(result).toEqual(mockEvent);
      expect(mockEventsService.findById).toHaveBeenCalledWith(eventId);
    });
  });

  describe('createEvent', () => {
    it('should create a new event', async () => {
      const adminUser = { id: 'admin-id', role: Role.ADMIN };
      mockEventsService.create.mockResolvedValue({
        id: 'new-event-id',
        ...mockCreateEventDto,
        createdBy: adminUser.id,
      });

      const result = await controller.createEvent(mockCreateEventDto, {
        user: adminUser,
      });
      expect(result).toEqual({
        id: 'new-event-id',
        ...mockCreateEventDto,
        createdBy: adminUser.id,
      });
      expect(mockEventsService.create).toHaveBeenCalledWith({
        ...mockCreateEventDto,
        createdBy: adminUser.id,
      });
    });
  });

  describe('updateEvent', () => {
    it('should update an event', async () => {
      const eventId = 'event-id-1';
      const adminUser = { id: 'admin-id', role: Role.ADMIN };
      const updatedEvent = { ...mockEvent, ...mockUpdateEventDto };

      mockEventsService.update.mockResolvedValue(updatedEvent);

      const result = await controller.updateEvent(eventId, mockUpdateEventDto, {
        user: adminUser,
      });
      expect(result).toEqual(updatedEvent);
      expect(mockEventsService.update).toHaveBeenCalledWith(
        eventId,
        mockUpdateEventDto,
      );
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event', async () => {
      const eventId = 'event-id-1';
      const adminUser = { id: 'admin-id', role: Role.ADMIN };

      mockEventsService.remove.mockResolvedValue(undefined);

      await controller.deleteEvent(eventId, { user: adminUser });
      expect(mockEventsService.remove).toHaveBeenCalledWith(eventId);
    });
  });
});
