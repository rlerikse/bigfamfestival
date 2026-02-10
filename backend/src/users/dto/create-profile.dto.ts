import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Role } from '../../auth/enums/role.enum';

/**
 * DTO for creating a user profile after Firebase registration.
 * The Firebase UID comes from the authenticated request (req.user.id),
 * not from the request body.
 */
export class CreateProfileDto {
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
  role?: Role;
}
