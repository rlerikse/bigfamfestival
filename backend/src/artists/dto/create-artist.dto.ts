import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsArray, IsUrl } from 'class-validator';

export class CreateArtistDto {
  @ApiPropertyOptional({ description: 'URL-friendly slug (auto-generated from name if omitted)' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ description: 'Artist name' })
  @IsString()
  @IsNotEmpty()
  name: string;

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

  @ApiPropertyOptional({ description: 'Artist image URL' })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Linked Firebase Auth user ID' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ description: 'Cached display name of linked user' })
  @IsString()
  @IsOptional()
  userDisplayName?: string;

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
