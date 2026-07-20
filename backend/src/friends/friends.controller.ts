import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { RespondFriendRequestDto } from './dto/respond-friend-request.dto';

@Controller('friends')
@UseGuards(FirebaseAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  // ─── User Lookup ──────────────────────────────────────────────────────────

  /**
   * GET /friends/search?q=<name>
   * Search for users by display name or email prefix.
   */
  @Get('search')
  async searchUsers(@Query('q') query: string, @Request() req) {
    return this.friendsService.searchUsers(query, req.user.uid);
  }

  // ─── Friend Requests ──────────────────────────────────────────────────────

  /**
   * POST /friends/requests
   * Send a friend request.
   */
  @Post('requests')
  async sendRequest(@Body() dto: SendFriendRequestDto, @Request() req) {
    return this.friendsService.sendRequest(req.user.uid, dto.toUserId);
  }

  /**
   * GET /friends/requests/incoming
   * Get pending incoming friend requests for the current user.
   */
  @Get('requests/incoming')
  async getIncomingRequests(@Request() req) {
    return this.friendsService.getIncomingRequests(req.user.uid);
  }

  /**
   * GET /friends/requests/outgoing
   * Get pending outgoing friend requests sent by the current user.
   */
  @Get('requests/outgoing')
  async getOutgoingRequests(@Request() req) {
    return this.friendsService.getOutgoingRequests(req.user.uid);
  }

  /**
   * PATCH /friends/requests/:id
   * Accept or decline a pending request (recipient only).
   */
  @Patch('requests/:id')
  async respondToRequest(
    @Param('id') id: string,
    @Body() dto: RespondFriendRequestDto,
    @Request() req,
  ) {
    return this.friendsService.respondToRequest(id, req.user.uid, dto.status);
  }

  /**
   * DELETE /friends/requests/:id
   * Cancel an outgoing request (sender only).
   */
  @Delete('requests/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelRequest(@Param('id') id: string, @Request() req) {
    return this.friendsService.cancelRequest(id, req.user.uid);
  }

  // ─── Friends List ─────────────────────────────────────────────────────────

  /**
   * GET /friends
   * Get current user's friend list.
   */
  @Get()
  async getFriends(@Request() req) {
    return this.friendsService.getFriends(req.user.uid);
  }

  /**
   * DELETE /friends/:friendId
   * Remove a friend (mutual).
   */
  @Delete(':friendId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFriend(@Param('friendId') friendId: string, @Request() req) {
    return this.friendsService.removeFriend(req.user.uid, friendId);
  }

  // ─── Friend Location/Campsite ─────────────────────────────────────────────

  /**
   * GET /friends/campsites
   * Get campsite locations for friends who have shareMyCampsite=true.
   */
  @Get('campsites')
  async getFriendCampsites(@Request() req) {
    return this.friendsService.getFriendCampsites(req.user.uid);
  }

  /**
   * GET /friends/locations
   * Get live locations for friends who have shareMyLocation=true.
   */
  @Get('locations')
  async getFriendLocations(@Request() req) {
    return this.friendsService.getFriendLocations(req.user.uid);
  }
}
