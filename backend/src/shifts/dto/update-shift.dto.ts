import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class UpdateShiftDto {
  @ApiProperty({ example: 'user123', required: false })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiProperty({ example: 'Jane Doe', required: false })
  @IsString()
  @IsOptional()
  userName?: string;

  @ApiProperty({ example: 'volunteer', required: false })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiProperty({ example: '2026-06-21', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be in YYYY-MM-DD format' })
  date?: string;

  @ApiProperty({ example: '10:00', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'Start time must be in HH:MM format' })
  startTime?: string;

  @ApiProperty({ example: '18:00', required: false })
  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'End time must be in HH:MM format' })
  endTime?: string;

  @ApiProperty({ example: 'VIP Area', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ example: 'Side Stage', required: false })
  @IsString()
  @IsOptional()
  stage?: string;

  @ApiProperty({ example: 'Updated notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
