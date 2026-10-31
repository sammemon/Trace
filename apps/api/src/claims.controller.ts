import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { apiSuccess } from '@trace/shared';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './auth.guard';
import { ClaimsService } from './claims.service';

@ApiTags('claims')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller()
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Post('items/:itemId/claims')
  async create(@Req() request: AuthenticatedRequest, @Param('itemId') itemId: string, @Body() body: unknown) { return apiSuccess(await this.claimsService.create(request.user!.id, itemId, body)); }

  @Get('claims/mine')
  async mine(@Req() request: AuthenticatedRequest) { return apiSuccess(await this.claimsService.mine(request.user!.id)); }

  @Get('items/:itemId/claims')
  async forItem(@Req() request: AuthenticatedRequest, @Param('itemId') itemId: string) { return apiSuccess(await this.claimsService.forItem(request.user!.id, itemId)); }

  @Post('claims/:claimId/approve')
  async approve(@Req() request: AuthenticatedRequest, @Param('claimId') claimId: string) { return apiSuccess(await this.claimsService.approve(request.user!.id, claimId)); }

  @Post('claims/:claimId/reject')
  async reject(@Req() request: AuthenticatedRequest, @Param('claimId') claimId: string, @Body() body: unknown) { return apiSuccess(await this.claimsService.reject(request.user!.id, claimId, body)); }
}
