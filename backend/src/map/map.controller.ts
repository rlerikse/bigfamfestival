import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { MapService } from './map.service';
import { Poi } from './interfaces/poi.interface';

@ApiTags('map')
@Controller('map')
export class MapController {
  constructor(private readonly mapService: MapService) {}

  /**
   * Returns all map POIs (admin-authored + seeded stages) for rendering on the
   * event map. Public: the map is unauthenticated content, and mobile mock-data
   * fallback triggers when there is no token, so a public route also fixes the
   * "no auth => fake stages" path.
   */
  @Get('pois')
  @Public()
  @ApiOperation({
    summary: 'Get all map POIs (stages, vendors, services, etc.)',
  })
  @ApiResponse({ status: 200, description: 'Array of POIs for the map.' })
  async getPois(): Promise<Poi[]> {
    return this.mapService.getPois();
  }
}
