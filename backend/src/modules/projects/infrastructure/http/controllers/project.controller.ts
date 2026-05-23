import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiCookieAuth,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ProjectsService } from 'src/modules/projects/application/services/project.service';
import {
  createProjectSchema,
  updateProjectSchema,
  type CreateProjectDto,
  type UpdateProjectDto,
  ProjectResponseDto,
  ProjectListResponseDto,
} from '../../../application/dtos/project.dto';
import { JwtAuthGuard } from 'src/middlewares/auth.middleware';
import { CurrentUser } from 'src/decorators/decorator';
import { ZodValidationPipe } from 'src/shared/zod/zod-validation-pipe';
import type { RequestUser } from 'src/middlewares/auth.middleware';

import { TasksService } from 'src/modules/tasks/application/services/task.service';
import { TaskListResponseDto } from 'src/modules/tasks/application/dtos/task.dto';

@ApiTags('projects')
@ApiCookieAuth('auth_token')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projects: ProjectsService,
    private readonly tasks: TasksService,
  ) {}

  // GET /api/v1/projects
  @Get()
  @ApiOperation({ summary: 'Listar projectos' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: ProjectListResponseDto })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.projects.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  // POST /api/v1/projects
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar projecto' })
  @ApiResponse({ status: 201, type: ProjectResponseDto })
  create(
    @Body(new ZodValidationPipe(createProjectSchema)) dto: CreateProjectDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.projects.create(dto, user.userId);
  }

  // GET /api/v1/projects/:id
  @Get(':id')
  @ApiOperation({ summary: 'Obter projecto por ID' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  findOne(@Param('id') id: string) {
    return this.projects.findById(id);
  }

  // PATCH /api/v1/projects/:id
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar projecto' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProjectSchema)) dto: UpdateProjectDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.projects.update(id, dto, user.userId, user.role);
  }

  // DELETE /api/v1/projects/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar projecto' })
  async remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    await this.projects.delete(id, user.userId, user.role);
  }

  // GET /api/v1/projects/:id/tasks
  @Get(':id/tasks')
  @ApiOperation({ summary: 'Tasks do projecto' })
  @ApiResponse({ status: 200, type: TaskListResponseDto })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getProjectTasks(
    @Param('id') id: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tasks.findAll({
      projectId: id,
      status: status as 'pending' | 'in_progress' | 'testing' | 'done',
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
