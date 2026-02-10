import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Request,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
// Auth handled by global FirebaseAuthGuard
import { CampsitesService } from './campsites.service';
import { CreateCampsiteDto } from './dto/create-campsite.dto';
import { Campsite } from './interfaces/campsite.interface';

@ApiTags('campsites')
@ApiBearerAuth()
@Controller('campsites')
export class CampsitesController {
  constructor(private readonly campsitesService: CampsitesService) {}

  @Post()
  @ApiOperation({ summary: 'Create or update user campsite location' })
  @ApiResponse({
    status: 201,
    description: 'Campsite created/updated successfully.',
    type: CreateCampsiteDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async upsertCampsite(
    @Request() req,
    @Body() createCampsiteDto: CreateCampsiteDto,
  ): Promise<Campsite> {
    const userId = req.user.id;
    return this.campsitesService.upsert(userId, createCampsiteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user campsite location' })
  @ApiResponse({
    status: 200,
    description: 'Returns the user campsite.',
    type: CreateCampsiteDto,
  })
  @ApiResponse({ status: 404, description: 'Campsite not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getCampsite(@Request() req): Promise<Campsite> {
    const userId = req.user.id;
    const campsite = await this.campsitesService.findByUserId(userId);
    if (!campsite) {
      throw new NotFoundException('Campsite not found for this user.');
    }
    return campsite;
  }

  @Delete()
  @ApiOperation({ summary: 'Delete user campsite location' })
  @ApiResponse({ status: 200, description: 'Campsite deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Campsite not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async deleteCampsite(@Request() req): Promise<{ message: string }> {
    const userId = req.user.id;
    await this.campsitesService.remove(userId);
    return { message: 'Campsite deleted successfully.' };
  }
}
