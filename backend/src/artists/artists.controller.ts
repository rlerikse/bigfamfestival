import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { ArtistsService } from './artists.service';
import { Artist } from './interfaces/artist.interface';

@Controller('artists')
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  @Get()
  async findAll(): Promise<Artist[]> {
    return this.artistsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Artist> {
    try {
      return await this.artistsService.findOne(id);
    } catch (error) {
      throw new NotFoundException(`Artist with ID "${id}" not found`);
    }
  }

  @Post()
  async create(
    @Body() artistData: Omit<Artist, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Artist> {
    return this.artistsService.create(artistData);
  }
}
