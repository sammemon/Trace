import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { apiSuccess } from '@trace/shared';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './auth.guard';
import { SavedSearchesService } from './saved-searches.service';

@ApiTags('saved-searches')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('saved-searches')
export class SavedSearchesController {
  constructor(private readonly savedSearchesService: SavedSearchesService) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest) { return apiSuccess(await this.savedSearchesService.list(request.user!.id)); }

  @Post()
  async create(@Req() request: AuthenticatedRequest, @Body() body: unknown) { return apiSuccess(await this.savedSearchesService.create(request.user!.id, body)); }

  @Delete(':id')
  async remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) { return apiSuccess(await this.savedSearchesService.remove(request.user!.id, id)); }
}