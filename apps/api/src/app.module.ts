import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from './prisma.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Module({ controllers: [HealthController, AuthController], providers: [PrismaService, AuthService, AuthGuard] })
export class AppModule {}
