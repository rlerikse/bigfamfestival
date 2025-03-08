import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ArrayMinSize,
} from 'class-validator';

export class UpdateEventDto {
  @ApiProperty({
    example: 'Updated Evening Concert',
    description: 'The updated name of the event',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MinLength(3)
  name?: string;

  @ApiProperty({
    example: 'Main Stage',
    description: 'The updated stage where the event takes place',
    required: false,
  })
  @IsString()
  @IsOptional()
  stage?: string;

  @ApiProperty({
    example: '2025-06-21',
    description: 'The updated date of the event (YYYY-MM-DD)',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  })
  date?: string;

  @ApiProperty({
    example: '20:00',
    description: 'The updated start time of the event (HH:MM)',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Start time must be in HH:MM format',
  })
  startTime?: string;

  @ApiProperty({
    example: '22:00',
    description: 'The updated end time of the event (HH:MM)',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'End time must be in HH:MM format',
  })
  endTime?: string;

  @ApiProperty({
    example: ['artist_uuid1', 'artist_uuid2', 'artist_uuid3'],
    description: 'Updated array of artist IDs associated with the event',
    required: false,
  })
  @IsArray()
  @IsOptional()
  @ArrayMinSize(1, {
    message: 'At least one artist must be assigned to an event',
  })
  @IsString({ each: true })
  artists?: string[];

  @ApiProperty({
    example: 'Updated description of the concert',
    description: 'Updated description of the event',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'https://images.bigfamfestival.com/events/updated-concert.jpg',
    description: 'Updated URL to event image',
    required: false,
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}
