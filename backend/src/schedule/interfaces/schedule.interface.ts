export interface ScheduleItem {
  id: string;
  userId: string;
  eventId: string;
  createdAt: Date;
}

export interface CreateScheduleItemDto {
  event_id: string;
  userId?: string; // Optional - will be ignored in favor of JWT token
}

export interface RemoveScheduleItemDto {
  event_id: string;
  userId?: string; // Optional - will be ignored in favor of JWT token
}
