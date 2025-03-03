import { Role } from '../../auth/enums/role.enum';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: Role;
  profilePictureUrl?: string;
  shareMyCampsite: boolean;
  shareMyLocation: boolean;
  ticketType: string; // Allowed values: "ga", "vip", "rv", default: "need-ticket"
  createdAt?: Date;
  updatedAt?: Date;
}
