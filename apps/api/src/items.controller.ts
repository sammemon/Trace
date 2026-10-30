import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { apiSuccess } from '@trace/shared';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './auth.guard';
import { ItemsService } from './items.service';

@ApiTags('items')
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get()
  async list(@Query() query: Record<string, unknown>) { return this.itemsService.list(query); }

  @Get(':id')
  async getOne(@Param('id') id: string) { return apiSuccess(await this.itemsService.getOne(id)); }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post()
  async create(@Req() request: AuthenticatedRequest, @Body() body: unknown) { return apiSuccess(await this.itemsService.create(request.user!.id, body)); }
}