// Types matching the NestJS backend interfaces

export interface User {
  id: string;
  email: string;
  displayName?: string;
  name?: string;
  role: 'admin' | 'artist' | 'vendor' | 'volunteer' | 'attendee' | 'staff' | 'director';
  phone?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
  disabled: boolean;
}

export interface Event {
  id: string;
  name: string;
  stage: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM
  endTime: string;    // HH:MM
  artists: string[];
  description?: string;
  imageUrl?: string;
}

export interface Artist {
  id: string;
  name: string;
  slug?: string;
  genre?: string;
  genres?: string[];
  bio?: string;
  imageUrl?: string;
  userId?: string;       // linked Firebase Auth user
  userDisplayName?: string; // cached for display
  soundcloudUrl?: string;
  spotifyUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Shift {
  id: string;
  userId: string;
  role: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status: 'scheduled' | 'checked-in' | 'completed' | 'no-show';
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  contactEmail: string;
  contactPhone?: string;
  boothLocation?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  audience: 'all' | 'artists' | 'vendors' | 'volunteers';
  sentAt?: string;
  scheduledFor?: string;
  status: 'draft' | 'scheduled' | 'sent';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardStats {
  totalUsers: number;
  totalArtists: number;
  totalEvents: number;
  totalVendors: number;
  upcomingShifts: number;
  pendingVendors: number;
}
