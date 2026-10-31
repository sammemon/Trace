import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { apiSuccess } from '@trace/shared';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async create(@Req() request: AuthenticatedRequest, @Body() body: unknown) { return apiSuccess(await this.reportsService.create(request.user!.id, body)); }

  @Get('mine')
  async mine(@Req() request: AuthenticatedRequest) { return apiSuccess(await this.reportsService.mine(request.user!.id)); }
}

@ApiTags('admin-reports')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
@Roles('MODERATOR')
@Controller('admin/reports')
export class AdminReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async queue() { return apiSuccess(await this.reportsService.queue()); }

  @Post(':id/resolve')
  async resolve(@Req() request: AuthenticatedRequest, @Param('id') id: string, @Body() body: unknown) { return apiSuccess(await this.reportsService.resolve(request.user!.id, id, body)); }
}
