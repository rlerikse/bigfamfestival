import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';
import { Role } from '../../auth/enums/role.enum';

export class UpdateUserDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'The name of the user',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'The email of the user',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: '555-123-4567',
    description: 'The phone number of the user',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    enum: Role,
    description: 'The role of the user',
    required: false,
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'The profile picture URL of the user',
    required: false,
  })
  @IsUrl()
  @IsOptional()
  profilePictureUrl?: string;

  @ApiProperty({
    example: true,
    description: 'Whether to share campsite location',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  shareMyCampsite?: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether to share current location',
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  shareMyLocation?: boolean;

  @ApiProperty({
    example: 'vip',
    description: 'The ticket type of the user',
    required: false,
  })
  @IsString()
  @IsOptional()
  ticketType?: string;
}
