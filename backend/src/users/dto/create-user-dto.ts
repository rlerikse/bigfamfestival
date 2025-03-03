import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';
import { Role } from '../../auth/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe', description: 'The name of the user' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'The email of the user',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'The password of the user' })
  @IsString()
  @IsNotEmpty()
  password: string;

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
    default: Role.ATTENDEE,
    description: 'The role of the user',
  })
  @IsEnum(Role)
  @IsOptional()
  role: Role;

  @ApiProperty({
    example: false,
    description: 'Whether to share campsite location',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  shareMyCampsite: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether to share current location',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  shareMyLocation: boolean;

  @ApiProperty({
    example: 'need-ticket',
    description: 'The ticket type of the user',
    default: 'need-ticket',
  })
  @IsString()
  @IsOptional()
  ticketType: string;
}
