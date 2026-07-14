import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { UsersService } from '../users/users.service';
import { ConflictException } from '@nestjs/common';
import { Role } from './enums/role.enum';

describe('AuthController', () => {
  let controller: AuthController;
  let usersService: UsersService;

  const mockUsersService = {
    findById: jest.fn(),
    createWithId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    usersService = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /auth/register', () => {
    const mockReq = {
      user: {
        id: 'firebase-uid-123',
        email: 'test@example.com',
        role: Role.ATTENDEE,
      },
    };

    const createProfileDto = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '555-123-4567',
      role: Role.ATTENDEE,
    };

    it('should create a new user profile and return 201', async () => {
      const expectedUser = {
        id: 'firebase-uid-123',
        name: 'Test User',
        email: 'test@example.com',
        phone: '555-123-4567',
        role: Role.ATTENDEE,
      };

      mockUsersService.findById.mockRejectedValue(new Error('Not found'));
      mockUsersService.createWithId.mockResolvedValue(expectedUser);

      const result = await controller.register(mockReq, createProfileDto);

      expect(result).toEqual(expectedUser);
      expect(mockUsersService.findById).toHaveBeenCalledWith(
        'firebase-uid-123',
        'test@example.com',
      );
      expect(mockUsersService.createWithId).toHaveBeenCalledWith(
        'firebase-uid-123',
        {
          name: 'Test User',
          email: 'test@example.com',
          phone: '555-123-4567',
          role: Role.ATTENDEE,
          profilePictureUrl: undefined,
        },
      );
    });

    it('should throw ConflictException if profile already exists', async () => {
      const existingUser = {
        id: 'firebase-uid-123',
        name: 'Existing User',
        email: 'test@example.com',
        role: Role.ATTENDEE,
      };

      mockUsersService.findById.mockResolvedValue(existingUser);

      await expect(
        controller.register(mockReq, createProfileDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should handle registration without optional fields', async () => {
      const minimalDto = {
        name: 'Minimal User',
        email: 'minimal@example.com',
      };

      const expectedUser = {
        id: 'firebase-uid-123',
        name: 'Minimal User',
        email: 'minimal@example.com',
        role: Role.ATTENDEE,
      };

      mockUsersService.findById.mockRejectedValue(new Error('Not found'));
      mockUsersService.createWithId.mockResolvedValue(expectedUser);

      const result = await controller.register(mockReq, minimalDto as any);

      expect(result).toEqual(expectedUser);
      expect(mockUsersService.createWithId).toHaveBeenCalledWith(
        'firebase-uid-123',
        {
          name: 'Minimal User',
          email: 'minimal@example.com',
          phone: undefined,
          role: undefined,
          profilePictureUrl: undefined,
        },
      );
    });
  });
});
