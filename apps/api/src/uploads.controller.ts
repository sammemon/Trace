import { Body, Controller, Delete, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { apiSuccess } from '@trace/shared';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './auth.guard';
import { UploadsService } from './uploads.service';

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presign')
  async presign(@Req() request: AuthenticatedRequest, @Body() body: unknown) { return apiSuccess(await this.uploadsService.presign(request.user!.id, body)); }

  @Post('confirm')
  async confirm(@Req() request: AuthenticatedRequest, @Body() body: unknown) { return apiSuccess(await this.uploadsService.confirm(request.user!.id, body)); }

  @Delete(':id')
  async remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) { return apiSuccess(await this.uploadsService.remove(request.user!.id, id)); }
}
