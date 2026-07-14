import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, IsUrl } from 'class-validator';

export class UpdateArtistDto {
  @ApiPropertyOptional({ description: 'New slug (triggers doc rename if different from current)' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: 'Artist name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Artist biography' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ description: 'Artist genre (legacy single)' })
  @IsString()
  @IsOptional()
  genre?: string;

  @ApiPropertyOptional({ description: 'Artist genres (array of tag names)' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  genres?: string[];

  @ApiPropertyOptional({ description: 'Linked Firebase Auth user ID' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Cached display name of linked user' })
  @IsString()
  @IsOptional()
  userDisplayName?: string;

  @ApiPropertyOptional({ description: 'Artist image URL' })
  @IsUrl({}, { message: 'imageUrl must be a valid URL' })
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'SoundCloud profile URL' })
  @IsString()
  @IsOptional()
  soundcloudUrl?: string;

  @ApiPropertyOptional({ description: 'Spotify artist URL' })
  @IsString()
  @IsOptional()
  spotifyUrl?: string;

  @ApiPropertyOptional({ description: 'Facebook page URL' })
  @IsString()
  @IsOptional()
  facebookUrl?: string;

  @ApiPropertyOptional({ description: 'Instagram profile URL' })
  @IsString()
  @IsOptional()
  instagramUrl?: string;
}
