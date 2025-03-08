import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ArrayMinSize,
} from 'class-validator';

export class CreateEventDto {
  @ApiProperty({
    example: 'Evening Concert',
    description: 'The name of the event',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @ApiProperty({
    example: 'Main Stage',
    description: 'The stage where the event takes place',
  })
  @IsString()
  @IsNotEmpty()
  stage: string;

  @ApiProperty({
    example: '2025-06-20',
    description: 'The date of the event (YYYY-MM-DD)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  })
  date: string;

  @ApiProperty({
    example: '19:00',
    description: 'The start time of the event (HH:MM)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Start time must be in HH:MM format',
  })
  startTime: string;

  @ApiProperty({
    example: '21:00',
    description: 'The end time of the event (HH:MM)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'End time must be in HH:MM format',
  })
  endTime: string;

  @ApiProperty({
    example: ['artist_uuid1', 'artist_uuid2'],
    description: 'Array of artist IDs associated with the event',
  })
  @IsArray()
  @ArrayMinSize(1, {
    message: 'At least one artist must be assigned to an event',
  })
  @IsString({ each: true })
  artists: string[];

  @ApiProperty({
    example: 'A wonderful evening concert featuring multiple artists',
    description: 'Description of the event',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'https://images.bigfamfestival.com/events/concert.jpg',
    description: 'URL to event image',
    required: false,
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  // createdBy will be set by the controller based on the authenticated user
  createdBy?: string;
}
