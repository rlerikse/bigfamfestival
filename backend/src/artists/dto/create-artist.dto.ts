import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateArtistDto {
  @ApiProperty({ description: 'Artist name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Artist biography' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ description: 'Artist genre' })
  @IsString()
  @IsNotEmpty()
  genre: string;

  @ApiPropertyOptional({ description: 'Artist image URL' })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;
}
