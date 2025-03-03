import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

// Key for roles metadata
export const ROLES_KEY = 'roles';

// Decorator to specify required roles for a route
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
