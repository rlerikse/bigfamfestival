import { IsNumber, Min, Max } from 'class-validator';

/**
 * Body for POST /friends/location — a periodic live-location ping from the
 * client. Only lat/lng; the server stamps updatedAt and derives the user from
 * the auth token.
 */
export class UpdateLocationDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}
