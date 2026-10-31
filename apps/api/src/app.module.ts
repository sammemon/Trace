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
import { SavedSearchesController } from './saved-searches.controller';
import { SavedSearchesService } from './saved-searches.service';
import { ClaimsController } from './claims.controller';
import { ClaimsService } from './claims.service';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({ controllers: [HealthController, AuthController, UsersController, ReferenceController, ItemsController, SavedSearchesController, ClaimsController, ChatController, NotificationsController], providers: [PrismaService, AuthService, AuthGuard, UsersService, RolesGuard, ItemsService, SavedSearchesService, ClaimsService, ChatService, NotificationsService] })
export class AppModule {}
