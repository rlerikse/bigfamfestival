export interface Shift {
  id: string;
  userId: string;
  userName: string;
  role: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  location: string;
  stage?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
