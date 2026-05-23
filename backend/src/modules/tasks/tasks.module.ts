import { Module, forwardRef } from '@nestjs/common';
import { TasksController } from './infrastructure/http/controllers/task.controller';
import { TasksService } from './application/services/task.service';
import { TasksRepository } from './infrastructure/persistence/task.repository';
import { TASKS_REPOSITORY } from './application/ports/task.port';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [forwardRef(() => ProjectsModule)],
  controllers: [TasksController],
  providers: [
    TasksService,
    { provide: TASKS_REPOSITORY, useClass: TasksRepository },
  ],
  exports: [TasksService, TASKS_REPOSITORY],
})
export class TasksModule {}
