import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
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
import { ChatGateway } from './chat.gateway';
import { AdminReportsController, ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ScheduleModule } from '@nestjs/schedule';
import { JobsService } from './jobs.service';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { MatchingService } from './matching.service';
import { RateLimitMiddleware } from './rate-limit.middleware';
import { RateLimitService } from './rate-limit.service';
import { BlocksService } from './blocks.service';

@Module({ imports: [ScheduleModule.forRoot()], controllers: [HealthController, AuthController, UsersController, ReferenceController, ItemsController, SavedSearchesController, ClaimsController, ChatController, NotificationsController, ReportsController, AdminReportsController, UploadsController], providers: [PrismaService, AuthService, AuthGuard, UsersService, RolesGuard, ItemsService, SavedSearchesService, ClaimsService, ChatService, NotificationsService, ChatGateway, ReportsService, JobsService, UploadsService, MatchingService, RateLimitService, BlocksService] })
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(RateLimitMiddleware).forRoutes('*');
	}
}
