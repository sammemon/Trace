import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { apiSuccess } from '@trace/shared';
import { AuthGuard } from './auth.guard';
import type { AuthenticatedRequest } from './auth.guard';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: unknown) {
    return apiSuccess(await this.authService.register(body));
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: unknown) {
    return apiSuccess(await this.authService.verifyEmail(body));
  }

  @Post('resend-otp')
  async resendOtp(@Body() body: unknown) { return apiSuccess(await this.authService.resendVerification(body)); }

  @Post('forgot-password')
  async forgotPassword(@Body() body: unknown) { return apiSuccess(await this.authService.forgotPassword(body)); }

  @Post('reset-password')
  async resetPassword(@Body() body: unknown) { return apiSuccess(await this.authService.resetPassword(body)); }

  @Post('login')
  async login(@Body() body: unknown) {
    return apiSuccess(await this.authService.login(body));
  }

  @Post('refresh')
  async refresh(@Body() body: unknown) {
    return apiSuccess(await this.authService.refresh(body));
  }

  @Post('logout')
  async logout(@Body() body: unknown) {
    return apiSuccess(await this.authService.logout(body));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('logout-all')
  async logoutAll(@Req() request: AuthenticatedRequest) { return apiSuccess(await this.authService.logoutAll(request.user!.id)); }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('change-password')
  async changePassword(@Req() request: AuthenticatedRequest, @Body() body: unknown) { return apiSuccess(await this.authService.changePassword(request.user!.id, body)); }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('/me')
  async me(@Req() request: AuthenticatedRequest) {
    return apiSuccess(await this.authService.getProfile(request.user!.id));
  }
}
