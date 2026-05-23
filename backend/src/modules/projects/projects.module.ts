import { Module, forwardRef } from '@nestjs/common';
import { ProjectsController } from './infrastructure/http/controllers/project.controller';
import { ProjectsService } from './application/services/project.service';
import { ProjectsRepository } from './infrastructure/persistence/project.repository';
import { PROJECTS_REPOSITORY } from './application/ports/project.port';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [forwardRef(() => TasksModule)],
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    { provide: PROJECTS_REPOSITORY, useClass: ProjectsRepository },
  ],
  exports: [ProjectsService, PROJECTS_REPOSITORY],
})
export class ProjectsModule {}
