import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { Role } from '../../auth/enums/role.enum';
import { UpdateUserDto } from './update-user.dto';

/**
 * DTO for admin-level user updates.
 * Extends UpdateUserDto and adds role assignment.
 * Only usable by ADMIN/STAFF routes.
 */
export class AdminUpdateUserDto extends UpdateUserDto {
  @ApiProperty({
    enum: Role,
    description: 'The role of the user (admin-only)',
    required: false,
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
