import { IsString, IsNotEmpty } from 'class-validator';

export class SendFriendRequestDto {
  @IsString()
  @IsNotEmpty()
  toUserId: string;
}
