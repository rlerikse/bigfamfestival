import { IsEnum } from 'class-validator';
import { FriendRequestStatus } from '../interfaces/friend-request.interface';

export class RespondFriendRequestDto {
  @IsEnum(['accepted', 'declined'])
  status: 'accepted' | 'declined';
}
