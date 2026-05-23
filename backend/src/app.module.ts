import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AllExceptionsFilter } from './middlewares/all-exceptions-filter';
import { JwtAuthGuard } from './middlewares/auth.middleware';
import { RolesGuard } from './middlewares/roles.guard';
import {
  ISessionsRepository,
  SESSIONS_REPOSITORY,
} from './modules/auth/application/ports/session.port';
import { SessionsRepository } from './modules/auth/infrastructure/persistence/session.repository';
import { Reflector } from '@nestjs/core';
import { LoggerMiddleware } from './middlewares/logger.middleware';
import {
  createRateLimitMiddleware,
  RateLimitPresets,
} from './middlewares/rate-limit.middleware';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { CommentsModule } from './modules/comments/comments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    TasksModule,
    CommentsModule,
  ],

  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    {
      provide: APP_GUARD,
      useFactory: (reflector: Reflector, sessionsRepo: ISessionsRepository) =>
        new JwtAuthGuard(reflector, sessionsRepo),
      inject: [Reflector, SESSIONS_REPOSITORY],
    },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: SESSIONS_REPOSITORY, useClass: SessionsRepository },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Logger on every route
    consumer
      .apply(LoggerMiddleware)
      .forRoutes({ path: '(.*)', method: RequestMethod.ALL });

    // Rate limit — tighter for auth endpoints
    consumer
      .apply(createRateLimitMiddleware(RateLimitPresets.AUTH))
      .forRoutes(
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'auth/login', method: RequestMethod.POST },
      );

    // General API rate limit
    consumer
      .apply(createRateLimitMiddleware(RateLimitPresets.API))
      .forRoutes({ path: '(.*)', method: RequestMethod.ALL });
  }
}
