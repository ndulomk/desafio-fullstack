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
import { TasksService } from 'src/modules/tasks/application/services/task.service';
import {
  createTaskSchema,
  updateTaskSchema,
  changeStatusSchema,
  moveTaskSchema,
  reorderTaskSchema,
  type CreateTaskDto,
  type UpdateTaskDto,
  type ChangeStatusDto,
  type MoveTaskDto,
  type ReorderTaskDto,
  TaskResponseDto,
  TaskListResponseDto,
} from '../../../application/dtos/task.dto';
import { JwtAuthGuard } from 'src/middlewares/auth.middleware';
import { CurrentUser } from 'src/decorators/decorator';
import { ZodValidationPipe } from 'src/shared/zod/zod-validation-pipe';
import type { RequestUser } from 'src/middlewares/auth.middleware';

@ApiTags('tasks')
@ApiCookieAuth('auth_token')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly svc: TasksService) {}

  // GET /api/v1/tasks
  @Get()
  @ApiOperation({ summary: 'Listar tasks com filtros' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'in_progress', 'testing', 'done'],
  })
  @ApiQuery({ name: 'assignedToUserId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: TaskListResponseDto })
  findAll(
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('assignedToUserId') assignedToUserId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.findAll({
      projectId,
      status: status as 'pending' | 'in_progress' | 'testing' | 'done',
      assignedToUserId,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  // POST /api/v1/tasks
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar task' })
  @ApiResponse({ status: 201, type: TaskResponseDto })
  create(
    @Body(new ZodValidationPipe(createTaskSchema)) dto: CreateTaskDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.create(dto, user.userId);
  }

  // GET /api/v1/tasks/:id
  @Get(':id')
  @ApiOperation({ summary: 'Obter task por ID' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  findOne(@Param('id') id: string) {
    return this.svc.findById(id);
  }

  // PATCH /api/v1/tasks/:id
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar task (título, descrição, assignee)' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTaskSchema)) dto: UpdateTaskDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.update(id, dto, user.userId);
  }

  // DELETE /api/v1/tasks/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar task' })
  async remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    await this.svc.delete(id, user.userId, user.role);
  }

  // PATCH /api/v1/tasks/:id/status — só muda status, mantém posição
  @Patch(':id/status')
  @ApiOperation({ summary: 'Mudar status da task (sem mover de coluna)' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  changeStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(changeStatusSchema)) dto: ChangeStatusDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.changeStatus(id, dto, user.userId);
  }

  // PATCH /api/v1/tasks/:id/move — muda coluna, posiciona no fundo
  @Patch(':id/move')
  @ApiOperation({ summary: 'Mover task para outra coluna' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  move(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(moveTaskSchema)) dto: MoveTaskDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.move(id, dto, user.userId);
  }

  // PATCH /api/v1/tasks/:id/position — reordena dentro da coluna
  @Patch(':id/position')
  @ApiOperation({ summary: 'Reordenar task dentro da coluna' })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  reorder(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(reorderTaskSchema)) dto: ReorderTaskDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.reorder(id, dto, user.userId);
  }
}
