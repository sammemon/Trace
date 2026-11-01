import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
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

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post()
  async create(@Req() request: AuthenticatedRequest, @Body() body: unknown) { return apiSuccess(await this.itemsService.create(request.user!.id, body)); }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('mine')
  async mine(@Req() request: AuthenticatedRequest) { return apiSuccess(await this.itemsService.mine(request.user!.id)); }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: unknown) { return apiSuccess(await this.itemsService.update(request.user!.id, id, body)); }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) { return apiSuccess(await this.itemsService.remove(request.user!.id, id)); }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post(':id/resolve')
  async resolve(@Req() request: AuthenticatedRequest, @Param('id') id: string) { return apiSuccess(await this.itemsService.resolve(request.user!.id, id)); }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post(':id/renew')
  async renew(@Req() request: AuthenticatedRequest, @Param('id') id: string) { return apiSuccess(await this.itemsService.renew(request.user!.id, id)); }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post(':id/bookmark')
  async bookmark(@Req() request: AuthenticatedRequest, @Param('id') id: string) { return apiSuccess(await this.itemsService.bookmark(request.user!.id, id)); }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Delete(':id/bookmark')
  async unbookmark(@Req() request: AuthenticatedRequest, @Param('id') id: string) { return apiSuccess(await this.itemsService.unbookmark(request.user!.id, id)); }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('bookmarks')
  async bookmarks(@Req() request: AuthenticatedRequest) { return apiSuccess(await this.itemsService.bookmarks(request.user!.id)); }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get(':id/matches')
  async matches(@Req() request: AuthenticatedRequest, @Param('id') id: string) { return apiSuccess(await this.itemsService.matches(request.user!.id, id)); }

  @Get(':id')
  async getOne(@Param('id') id: string) { return apiSuccess(await this.itemsService.getOne(id)); }
}