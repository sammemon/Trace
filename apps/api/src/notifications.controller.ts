import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { apiSuccess } from '@trace/shared';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest) { return apiSuccess(await this.notificationsService.list(request.user!.id)); }

  @Get('unread-count')
  async unreadCount(@Req() request: AuthenticatedRequest) { return apiSuccess(await this.notificationsService.unreadCount(request.user!.id)); }

  @Post(':id/read')
  async markRead(@Req() request: AuthenticatedRequest, @Param('id') id: string) { return apiSuccess(await this.notificationsService.markRead(request.user!.id, id)); }

  @Post('read-all')
  async markAllRead(@Req() request: AuthenticatedRequest) { return apiSuccess(await this.notificationsService.markAllRead(request.user!.id)); }
}
