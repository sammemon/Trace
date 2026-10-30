import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { apiSuccess } from '@trace/shared';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './auth.guard';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async me(@Req() request: AuthenticatedRequest) { return apiSuccess(await this.usersService.getProfile(request.user!.id)); }

  @Patch('me')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async update(@Req() request: AuthenticatedRequest, @Body() body: unknown) { return apiSuccess(await this.usersService.updateProfile(request.user!.id, body)); }

  @Delete('me')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async remove(@Req() request: AuthenticatedRequest) { return apiSuccess(await this.usersService.deleteAccount(request.user!.id)); }

  @Get(':id/public')
  async publicProfile(@Param('id') id: string) { return apiSuccess(await this.usersService.getPublicProfile(id)); }

  @Post('me/device-tokens')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async addDevice(@Req() request: AuthenticatedRequest, @Body() body: unknown) { return apiSuccess(await this.usersService.registerDeviceToken(request.user!.id, body)); }

  @Delete('me/device-tokens/:token')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async removeDevice(@Req() request: AuthenticatedRequest, @Param('token') token: string) { return apiSuccess(await this.usersService.removeDeviceToken(request.user!.id, token)); }

  @Patch('me/notification-prefs')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  async preferences(@Req() request: AuthenticatedRequest, @Body() body: unknown) { return apiSuccess(await this.usersService.updateNotificationPreferences(request.user!.id, body)); }
}