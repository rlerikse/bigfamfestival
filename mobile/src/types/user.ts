/**
 * User roles in the application
 */
export enum UserRole {
  ADMIN = 'admin',
  STAFF = 'staff',
  ARTIST = 'artist',
  VENDOR = 'vendor',
  VOLUNTEER = 'volunteer',
  DIRECTOR = 'director',
  ATTENDEE = 'attendee',
}

/**
 * Ticket types for users
 */
export enum TicketType {
  GA = 'ga',         // General Admission
  VIP = 'vip',       // VIP ticket
  RV = 'rv',         // RV camping
  NEED_TICKET = 'need-ticket', // No ticket yet
}

/**
 * User interface for users stored in Firestore
 */
export interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  profilePictureUrl?: string;
  shareMyCampsite: boolean;
  shareMyLocation: boolean;
  ticketType: string;
  createdAt: Date;
  updatedAt: Date;
}
