import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from './prisma.service';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { RolesGuard } from './roles.guard';
import { ReferenceController } from './reference.controller';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';

@Module({ controllers: [HealthController, AuthController, UsersController, ReferenceController, ItemsController], providers: [PrismaService, AuthService, AuthGuard, UsersService, RolesGuard, ItemsService] })
export class AppModule {}
