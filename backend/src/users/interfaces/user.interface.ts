import { Role } from '../../auth/enums/role.enum';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  profilePictureUrl?: string;
  shareMyCampsite: boolean;
  shareMyLocation: boolean;
  ticketType: string; // Allowed values: "ga", "vip", "rv", default: "need-ticket"
  expoPushToken?: string; // The push notification token for this user's device
  notificationsEnabled?: boolean; // Whether the user has enabled push notifications
  userGroups?: string[]; // Groups the user belongs to (for targeted notifications)
  createdAt?: Date;
  updatedAt?: Date;
}
