import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { FirestoreService } from '../config/firestore/firestore.service';
import { NotFoundException } from '@nestjs/common';

describe('EventsService', () => {
  let service: EventsService;
  let firestoreService: FirestoreService;

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
    createdBy: 'admin-id-1',
  };

  // Create a mock FirestoreService
  const mockFirestoreService = {
    create: jest.fn(),
    get: jest.fn(),
    getAll: jest.fn(),
    query: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: FirestoreService,
          useValue: mockFirestoreService,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    firestoreService = module.get<FirestoreService>(FirestoreService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new event', async () => {
      mockFirestoreService.create.mockResolvedValue({
        id: 'new-event-id',
        data: mockCreateEventDto,
      });

      const result = await service.create(mockCreateEventDto);
      expect(result).toEqual({
        id: 'new-event-id',
        ...mockCreateEventDto,
      });
      expect(mockFirestoreService.create).toHaveBeenCalledWith(
        'events',
        mockCreateEventDto,
      );
    });
  });

  describe('findById', () => {
    it('should return an event if it exists', async () => {
      const eventId = 'event-id-1';
      const eventData = { ...mockEvent };
      delete eventData.id;

      mockFirestoreService.get.mockResolvedValue(eventData);

      const result = await service.findById(eventId);
      expect(result).toEqual(mockEvent);
      expect(mockFirestoreService.get).toHaveBeenCalledWith('events', eventId);
    });

    it('should throw NotFoundException if event does not exist', async () => {
      const eventId = 'non-existent-id';

      mockFirestoreService.get.mockResolvedValue(null);

      await expect(service.findById(eventId)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockFirestoreService.get).toHaveBeenCalledWith('events', eventId);
    });
  });

  describe('findAll', () => {
    it('should return all events when no filters are provided', async () => {
      const events = [mockEvent];

      mockFirestoreService.getAll.mockResolvedValue(events);

      const result = await service.findAll();
      expect(result).toEqual(events);
      expect(mockFirestoreService.getAll).toHaveBeenCalledWith('events');
    });

    it('should filter events by stage', async () => {
      const stage = 'Main Stage';
      const events = [mockEvent];

      mockFirestoreService.query.mockResolvedValue(events);

      const result = await service.findAll(stage);
      expect(result).toEqual(events);
      expect(mockFirestoreService.query).toHaveBeenCalledWith(
        'events',
        'stage',
        '==',
        stage,
      );
    });

    it('should filter events by date', async () => {
      const date = '2025-06-20';
      const events = [mockEvent];

      mockFirestoreService.query.mockResolvedValue(events);

      const result = await service.findAll(undefined, date);
      expect(result).toEqual(events);
      expect(mockFirestoreService.query).toHaveBeenCalledWith(
        'events',
        'date',
        '==',
        date,
      );
    });
  });

  // You can add more tests for update, remove, and findByArtist methods
});
