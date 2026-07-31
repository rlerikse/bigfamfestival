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
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { Observable, interval, from, concat, of } from 'rxjs';
import { switchMap, distinctUntilChanged, catchError } from 'rxjs/operators';
import { FriendsService } from './friends.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { RespondFriendRequestDto } from './dto/respond-friend-request.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

/**
 * Server-side cadence for the friend-location SSE stream. 5s balances
 * freshness against Firestore read volume (one getFriendLocations() per tick
 * per connected client). Distinct-until-changed suppresses redundant emits.
 */
const FRIEND_LOCATION_STREAM_INTERVAL_MS = 5000;

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

  /**
   * GET /friends/locations/stream (Server-Sent Events)
   * Realtime replacement for clients that would otherwise poll GET
   * /friends/locations on a timer. Pushes the caller's opted-in friend
   * locations on connect and every FRIEND_LOCATION_STREAM_INTERVAL_MS after,
   * reusing getFriendLocations() verbatim so ALL opt-in / mutual-friend /
   * shareMyLocation filtering stays identical to the polled endpoint.
   *
   * Auth is unchanged: the class-level FirebaseAuthGuard verifies the same
   * Firebase Bearer token (the RN client uses react-native-sse to attach the
   * Authorization header). No Firestore rule or permission-logic changes.
   *
   * Consecutive identical payloads are de-duplicated so we don't emit noise
   * when nobody has moved; the client keeps its last render.
   */
  @Sse('locations/stream')
  streamFriendLocations(@Request() req): Observable<MessageEvent> {
    const uid = req.user.uid;
    // Fetch + normalize to an SSE MessageEvent. Errors are surfaced as a
    // discrete 'error' payload rather than tearing down the stream, so the
    // client can fall back to its polling path without the connection dying.
    const fetchEvent = (): Observable<MessageEvent> =>
      from(this.friendsService.getFriendLocations(uid)).pipe(
        switchMap((locations) => of({ data: locations } as MessageEvent)),
        catchError((err) =>
          of({
            data: {
              error: 'stream_error',
              message: String(err?.message ?? err),
            },
          } as MessageEvent),
        ),
      );

    // Emit immediately on connect, then on a fixed server-side cadence.
    return concat(
      fetchEvent(),
      interval(FRIEND_LOCATION_STREAM_INTERVAL_MS).pipe(
        switchMap(() => fetchEvent()),
      ),
    ).pipe(
      // Only push when the serialized payload actually changed, so a stationary
      // crowd doesn't generate redundant events.
      distinctUntilChanged(
        (a, b) => JSON.stringify(a.data) === JSON.stringify(b.data),
      ),
    );
  }

  /**
   * POST /friends/location
   * Upsert the caller's own live location (periodic ping from the client).
   * Only persisted when the user has shareMyLocation=true.
   */
  @Post('location')
  @HttpCode(HttpStatus.OK)
  async updateMyLocation(@Request() req, @Body() dto: UpdateLocationDto) {
    return this.friendsService.updateMyLocation(req.user.uid, dto.lat, dto.lng);
  }
}
