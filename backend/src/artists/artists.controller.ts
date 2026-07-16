import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { Public } from '../auth/decorators/public.decorator';
import { ArtistsService } from './artists.service';
import { Artist } from './interfaces/artist.interface';
import { CreateArtistDto } from './dto/create-artist.dto';
import { UpdateArtistDto } from './dto/update-artist.dto';

@ApiTags('artists')
@Controller('artists')
export class ArtistsController {
  constructor(private readonly artistsService: ArtistsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all artists. Pass ?year=YYYY to filter by festival year (e.g. public app). Omit for all artists (e.g. admin).' })
  @ApiResponse({ status: 200, description: 'Returns list of artists' })
  async findAll(@Query('year') year?: string): Promise<Artist[]> {
    const yearNum = year ? parseInt(year, 10) : undefined;
    return this.artistsService.findAll(yearNum);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get artist by ID' })
  @ApiParam({ name: 'id', description: 'Artist ID' })
  @ApiResponse({ status: 200, description: 'Returns the artist' })
  @ApiResponse({ status: 404, description: 'Artist not found' })
  async findOne(@Param('id') id: string): Promise<Artist> {
    try {
      return await this.artistsService.findOne(id);
    } catch (error) {
      throw new NotFoundException(`Artist with ID "${id}" not found`);
    }
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new artist (Admin only)' })
  @ApiResponse({ status: 201, description: 'Artist created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createArtistDto: CreateArtistDto): Promise<Artist> {
    return this.artistsService.create(createArtistDto);
  }

  @Patch(':slug')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an artist by slug (Admin only). Changing slug renames the doc and updates event refs.' })
  @ApiParam({ name: 'slug', description: 'Current artist slug' })
  @ApiResponse({ status: 200, description: 'Artist updated successfully' })
  @ApiResponse({ status: 404, description: 'Artist not found' })
  @ApiResponse({ status: 409, description: 'New slug conflicts with existing artist' })
  async update(
    @Param('slug') slug: string,
    @Body() updateArtistDto: UpdateArtistDto,
  ): Promise<Artist> {
    return this.artistsService.update(slug, updateArtistDto);
  }

  @Delete(':slug')
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an artist by slug (Admin only)' })
  @ApiParam({ name: 'slug', description: 'Artist slug' })
  @ApiResponse({ status: 200, description: 'Artist deleted' })
  @ApiResponse({ status: 404, description: 'Artist not found' })
  async remove(@Param('slug') slug: string): Promise<void> {
    return this.artistsService.delete(slug);
  }
}
