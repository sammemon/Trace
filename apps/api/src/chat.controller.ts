import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { apiSuccess } from '@trace/shared';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './auth.guard';
import { ChatService } from './chat.service';

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  async conversations(@Req() request: AuthenticatedRequest) { return apiSuccess(await this.chatService.conversations(request.user!.id)); }

  @Post('claims/:claimId/conversation')
  async createForClaim(@Req() request: AuthenticatedRequest, @Param('claimId') claimId: string) { return apiSuccess(await this.chatService.createForClaim(request.user!.id, claimId)); }

  @Get('conversations/:conversationId/messages')
  async messages(@Req() request: AuthenticatedRequest, @Param('conversationId') conversationId: string) { return apiSuccess(await this.chatService.messages(request.user!.id, conversationId)); }

  @Post('conversations/:conversationId/messages')
  async send(@Req() request: AuthenticatedRequest, @Param('conversationId') conversationId: string, @Body() body: unknown) { return apiSuccess(await this.chatService.send(request.user!.id, conversationId, body)); }
}
