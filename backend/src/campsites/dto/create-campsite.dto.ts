import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
} from 'class-validator';

export class CreateCampsiteDto {
  @ApiProperty({
    description: 'Latitude of the campsite location',
    example: 40.7128,
  })
  @IsNotEmpty()
  @IsLatitude()
  location_lat: number;

  @ApiProperty({
    description: 'Longitude of the campsite location',
    example: -74.006,
  })
  @IsNotEmpty()
  @IsLongitude()
  location_long: number;

  @ApiProperty({
    description: 'Whether the campsite location is shared with friends',
    example: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  shared_with_friends: boolean;
}
