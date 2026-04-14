import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class CreateShiftDto {
  @ApiProperty({ example: 'user123', description: 'ID of the assigned user' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'Jane Doe', description: 'Name of the assigned user' })
  @IsString()
  @IsNotEmpty()
  userName: string;

  @ApiProperty({ example: 'staff', description: 'Role for the shift' })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({ example: '2026-06-20', description: 'Shift date (YYYY-MM-DD)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' })
  date: string;

  @ApiProperty({ example: '08:00', description: 'Start time (HH:MM)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Start time must be in HH:MM format' })
  startTime: string;

  @ApiProperty({ example: '16:00', description: 'End time (HH:MM)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'End time must be in HH:MM format' })
  endTime: string;

  @ApiProperty({ example: 'Main Gate', description: 'Shift location' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ example: 'Main Stage', description: 'Stage assignment', required: false })
  @IsString()
  @IsOptional()
  stage?: string;

  @ApiProperty({ example: 'Bring radio', description: 'Additional notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
