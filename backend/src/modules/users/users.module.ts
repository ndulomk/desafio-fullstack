import { Module } from '@nestjs/common';
import { UsersController } from './infrastructure/http/controllers/user.controller';
import { UsersService } from './application/services/user.service';
import { UsersRepository } from './infrastructure/persistence/user.repository';
import { USERS_REPOSITORY } from './application/ports/user.port';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    { provide: USERS_REPOSITORY, useClass: UsersRepository },
  ],
  exports: [UsersService, USERS_REPOSITORY],
})
export class UsersModule {}
