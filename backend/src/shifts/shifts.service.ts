import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FirestoreService } from '../config/firestore/firestore.service';
import { Shift } from './interfaces/shift.interface';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';

@Injectable()
export class ShiftsService {
  private readonly collectionName = 'shifts';
  private readonly logger = new Logger(ShiftsService.name);

  constructor(private readonly firestoreService: FirestoreService) {}

  async create(createShiftDto: CreateShiftDto): Promise<Shift> {
    const now = new Date();
    const shiftData = {
      ...createShiftDto,
      createdAt: now,
      updatedAt: now,
    };

    const { id, data } = await this.firestoreService.create<typeof shiftData>(
      this.collectionName,
      shiftData,
    );

    return { id, ...data } as Shift;
  }

  async findById(id: string): Promise<Shift> {
    const shift = await this.firestoreService.get<Shift>(
      this.collectionName,
      id,
    );
    if (!shift) {
      throw new NotFoundException(`Shift with ID "${id}" not found`);
    }
    return shift;
  }

  async findAll(filters?: {
    date?: string;
    role?: string;
    userId?: string;
  }): Promise<Shift[]> {
    const shifts = await this.firestoreService.getAll<Shift>(
      this.collectionName,
    );

    let filtered = shifts;

    if (filters?.date) {
      filtered = filtered.filter((s) => s.date === filters.date);
    }
    if (filters?.role) {
      filtered = filtered.filter((s) => s.role === filters.role);
    }
    if (filters?.userId) {
      filtered = filtered.filter((s) => s.userId === filters.userId);
    }

    return filtered.sort((a, b) => {
      const dtA = `${a.date}T${a.startTime}`;
      const dtB = `${b.date}T${b.startTime}`;
      return dtA.localeCompare(dtB);
    });
  }

  async update(id: string, updateShiftDto: UpdateShiftDto): Promise<Shift> {
    await this.findById(id); // ensure exists
    const updateData = {
      ...updateShiftDto,
      updatedAt: new Date(),
    };
    await this.firestoreService.update<typeof updateData>(
      this.collectionName,
      id,
      updateData,
    );
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id); // ensure exists
    await this.firestoreService.delete(this.collectionName, id);
  }
}
