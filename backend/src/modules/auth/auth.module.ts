import { Global, Module } from '@nestjs/common';
import { AuthController } from './infrastructure/http/controllers/auth.controller';
import { AuthService } from './application/services/auth.service';
import { SessionsRepository } from './infrastructure/persistence/session.repository';
import { SESSIONS_REPOSITORY } from './application/ports/session.port';
import { UsersModule } from '../users/users.module';

@Global()
@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: SESSIONS_REPOSITORY, useClass: SessionsRepository },
  ],
  exports: [AuthService, SESSIONS_REPOSITORY],
})
export class AuthModule {}
