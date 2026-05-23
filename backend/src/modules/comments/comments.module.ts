import { Module } from '@nestjs/common';
import { CommentsController } from './infrastructure/http/controllers/comment.controller';
import { CommentsService } from './application/services/comment.service';
import { CommentsRepository } from './infrastructure/persistence/comment.repository';
import { COMMENTS_REPOSITORY } from './application/ports/comment.port';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [TasksModule],
  controllers: [CommentsController],
  providers: [
    CommentsService,
    { provide: COMMENTS_REPOSITORY, useClass: CommentsRepository },
  ],
})
export class CommentsModule {}
