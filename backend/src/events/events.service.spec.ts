import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { FirestoreService } from '../config/firestore/firestore.service';
import { ArtistsService } from '../artists/artists.service';
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
    // queryCompound() uses .collection().where().get(); return a chainable stub
    // whose get() resolves whatever overlapPeers is set to per-test.
    collection: jest.fn(),
  };

  // Peers returned by the compound (stage+festivalDay) query used in overlap
  // checks. Default empty so existing create/update tests see no conflicts.
  let overlapPeers: any[] = [];

  // Create a mock ArtistsService (used to build the denormalized artistsCache)
  const mockArtistsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: FirestoreService,
          useValue: mockFirestoreService,
        },
        {
          provide: ArtistsService,
          useValue: mockArtistsService,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    firestoreService = module.get<FirestoreService>(FirestoreService);

    // Wire the chainable collection().where().where().get() stub.
    overlapPeers = [];
    const chain: any = {
      where: jest.fn(() => chain),
      get: jest.fn(async () => ({
        docs: overlapPeers.map((p) => ({
          id: p.id,
          data: () => {
            const { id, ...rest } = p;
            return rest;
          },
        })),
      })),
    };
    mockFirestoreService.collection.mockReturnValue(chain);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new event with computed festivalDay and default blockType', async () => {
      const persisted = {
        ...mockCreateEventDto,
        blockType: 'artist_set',
        festivalDay: '2025-06-21',
        artistsCache: [],
      };
      mockFirestoreService.create.mockResolvedValue({
        id: 'new-event-id',
        data: persisted,
      });
      mockArtistsService.findOne.mockResolvedValue(null);

      const result = await service.create(mockCreateEventDto);
      expect(result).toEqual({ id: 'new-event-id', ...persisted });
      // evening event (19:00) -> festivalDay equals date; blockType defaults
      expect(mockFirestoreService.create).toHaveBeenCalledWith('events', {
        ...mockCreateEventDto,
        blockType: 'artist_set',
        festivalDay: '2025-06-21',
        artistsCache: [],
      });
    });

    it('computes festivalDay to the previous calendar date for an after-midnight (<06:00) set', async () => {
      const lateDto = {
        ...mockCreateEventDto,
        startTime: '02:00',
        endTime: '04:00',
      };
      mockFirestoreService.create.mockResolvedValue({
        id: 'late-id',
        data: {},
      });
      mockArtistsService.findOne.mockResolvedValue(null);

      await service.create(lateDto);

      expect(mockFirestoreService.create).toHaveBeenCalledWith(
        'events',
        expect.objectContaining({ festivalDay: '2025-06-20' }),
      );
    });

    it('respects an explicitly provided blockType', async () => {
      const wsDto = { ...mockCreateEventDto, blockType: 'workshop' as const };
      mockFirestoreService.create.mockResolvedValue({ id: 'ws-id', data: {} });
      mockArtistsService.findOne.mockResolvedValue(null);

      await service.create(wsDto);

      expect(mockFirestoreService.create).toHaveBeenCalledWith(
        'events',
        expect.objectContaining({ blockType: 'workshop' }),
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

  describe('update — festivalDay recomputation (#166)', () => {
    const existing = {
      name: 'Test Event',
      stage: 'Main Stage',
      date: '2026-06-20',
      startTime: '23:00',
      endTime: '23:59',
      artists: ['artist-id-1'],
      festivalDay: '2026-06-20',
      blockType: 'artist_set',
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockFirestoreService.get.mockResolvedValue({ ...existing });
      mockFirestoreService.update.mockResolvedValue(undefined);
    });

    it('recomputes festivalDay when startTime changes to after midnight', async () => {
      await service.update('event-id-1', { startTime: '02:00' });
      expect(mockFirestoreService.update).toHaveBeenCalledWith(
        'events',
        'event-id-1',
        expect.objectContaining({
          startTime: '02:00',
          festivalDay: '2026-06-19',
        }),
      );
    });

    it('recomputes festivalDay when date changes', async () => {
      await service.update('event-id-1', { date: '2026-06-22' });
      expect(mockFirestoreService.update).toHaveBeenCalledWith(
        'events',
        'event-id-1',
        expect.objectContaining({
          date: '2026-06-22',
          festivalDay: '2026-06-22',
        }),
      );
    });

    it('does not touch festivalDay when neither date nor startTime changes', async () => {
      await service.update('event-id-1', { name: 'Renamed Event' });
      const patch = mockFirestoreService.update.mock.calls[0][2];
      expect(patch).not.toHaveProperty('festivalDay');
    });
  });

  describe('backfillScheduleFields (#166)', () => {
    it('sets default blockType and computes festivalDay only on docs that need it', async () => {
      const docs = [
        // needs both
        { id: 'a', date: '2026-06-21', startTime: '02:00' },
        // already correct -> skipped
        {
          id: 'b',
          date: '2026-06-21',
          startTime: '19:00',
          festivalDay: '2026-06-21',
          blockType: 'artist_set',
        },
        // malformed time -> festivalDay skipped, blockType still applied
        { id: 'c', date: '2026-06-21', startTime: 'bad' },
      ];
      mockFirestoreService.getAll.mockResolvedValue(docs);
      mockFirestoreService.update.mockClear();
      mockFirestoreService.update.mockResolvedValue(undefined);

      const summary = await service.backfillScheduleFields();

      expect(summary).toEqual({ scanned: 3, updated: 2, skipped: 1 });
      expect(mockFirestoreService.update).toHaveBeenCalledWith('events', 'a', {
        blockType: 'artist_set',
        festivalDay: '2026-06-20',
      });
      expect(mockFirestoreService.update).toHaveBeenCalledWith('events', 'c', {
        blockType: 'artist_set',
      });
      // 'b' is untouched
      expect(mockFirestoreService.update).not.toHaveBeenCalledWith(
        'events',
        'b',
        expect.anything(),
      );
    });
  });

  describe('overlap validation (#167)', () => {
    const baseDto = {
      name: 'New Set',
      stage: 'Apogee',
      date: '2026-06-21',
      startTime: '20:00',
      endTime: '22:00',
      artists: ['artist-id-1'],
      createdBy: 'admin-id-1',
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockArtistsService.findOne.mockResolvedValue(null);
      mockFirestoreService.create.mockResolvedValue({ id: 'x', data: {} });
      mockFirestoreService.update.mockResolvedValue(undefined);
    });

    it('rejects create overlapping a same-stage/same-festivalDay event', async () => {
      overlapPeers = [
        {
          id: 'peer-1',
          name: 'Headliner',
          stage: 'Apogee',
          festivalDay: '2026-06-21',
          startTime: '21:00',
          endTime: '23:00',
        },
      ];

      await expect(service.create(baseDto)).rejects.toThrow(/Headliner/);
      await expect(service.create(baseDto)).rejects.toThrow(/21:00.*23:00/);
      expect(mockFirestoreService.create).not.toHaveBeenCalled();
    });

    it('allows create on same stage but different festivalDay', async () => {
      // The compound query is keyed on festivalDay, so a different-night peer
      // simply is not returned -> no conflict.
      overlapPeers = [];
      await expect(service.create(baseDto)).resolves.toBeDefined();
      expect(mockFirestoreService.create).toHaveBeenCalled();
    });

    it('rejects a cross-midnight overlap (2am set vs a 11pm–1am peer)', async () => {
      // 2am set on 2026-06-22 -> festivalDay 2026-06-21, same night as an
      // 11pm–1am block. They must be checked against each other.
      const lateDto = {
        ...baseDto,
        date: '2026-06-22',
        startTime: '02:00',
        endTime: '03:00',
      };
      overlapPeers = [
        {
          id: 'peer-late',
          name: 'Night Owl',
          stage: 'Apogee',
          festivalDay: '2026-06-21',
          startTime: '23:00',
          endTime: '01:00',
        },
      ];
      // no direct overlap here (2–3am vs 11pm–1am) -> allowed
      await expect(service.create(lateDto)).resolves.toBeDefined();

      // now a genuinely overlapping after-midnight peer
      mockFirestoreService.create.mockClear();
      overlapPeers = [
        {
          id: 'peer-late-2',
          name: 'Sunrise Set',
          stage: 'Apogee',
          festivalDay: '2026-06-21',
          startTime: '01:30',
          endTime: '02:30',
        },
      ];
      await expect(service.create(lateDto)).rejects.toThrow(/Sunrise Set/);
      expect(mockFirestoreService.create).not.toHaveBeenCalled();
    });

    it('allows back-to-back sets on the same stage/festivalDay', async () => {
      overlapPeers = [
        {
          id: 'peer-earlier',
          name: 'Opener',
          stage: 'Apogee',
          festivalDay: '2026-06-21',
          startTime: '18:00',
          endTime: '20:00', // ends exactly when baseDto starts
        },
      ];
      await expect(service.create(baseDto)).resolves.toBeDefined();
      expect(mockFirestoreService.create).toHaveBeenCalled();
    });

    it('excludes the event itself when validating an update', async () => {
      mockFirestoreService.get.mockResolvedValue({
        name: 'Existing',
        stage: 'Apogee',
        date: '2026-06-21',
        startTime: '20:00',
        endTime: '22:00',
        festivalDay: '2026-06-21',
        artists: ['artist-id-1'],
      });
      // The only peer is the event being updated -> must not self-conflict.
      overlapPeers = [
        {
          id: 'event-id-1',
          name: 'Existing',
          stage: 'Apogee',
          festivalDay: '2026-06-21',
          startTime: '20:00',
          endTime: '22:00',
        },
      ];
      await expect(
        service.update('event-id-1', { endTime: '22:30' }),
      ).resolves.toBeDefined();
      expect(mockFirestoreService.update).toHaveBeenCalled();
    });
  });

  describe('partial move/resize updates (#168)', () => {
    const stored = {
      name: 'Movable Set',
      stage: 'Apogee',
      date: '2026-06-21',
      startTime: '20:00',
      endTime: '22:00',
      festivalDay: '2026-06-21',
      artists: ['artist-id-1'],
      blockType: 'artist_set',
      description: 'keep me',
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockFirestoreService.get.mockResolvedValue({ ...stored });
      mockFirestoreService.update.mockResolvedValue(undefined);
    });

    it('resize: updates only endTime, leaves every other field untouched', async () => {
      await service.update('event-id-1', { endTime: '23:00' });
      const patch = mockFirestoreService.update.mock.calls[0][2];
      expect(patch).toEqual({ endTime: '23:00' }); // festivalDay unchanged (endTime doesn't affect it)
      expect(patch).not.toHaveProperty('name');
      expect(patch).not.toHaveProperty('description');
    });

    it('move: updates stage/date/startTime/endTime via minimal payload and recomputes festivalDay', async () => {
      await service.update('event-id-1', {
        stage: 'Bayou',
        date: '2026-06-22',
        startTime: '02:00',
        endTime: '03:00',
      });
      const patch = mockFirestoreService.update.mock.calls[0][2];
      expect(patch).toMatchObject({
        stage: 'Bayou',
        date: '2026-06-22',
        startTime: '02:00',
        endTime: '03:00',
        festivalDay: '2026-06-21', // 02:00 -> previous festival day
      });
      expect(patch).not.toHaveProperty('artists');
      expect(patch).not.toHaveProperty('description');
    });

    it('preserves unrelated fields on the returned record', async () => {
      const result = await service.update('event-id-1', { endTime: '23:00' });
      expect(result.description).toBe('keep me');
      expect(result.name).toBe('Movable Set');
      expect(result.endTime).toBe('23:00');
    });
  });

  // You can add more tests for update, remove, and findByArtist methods
});
