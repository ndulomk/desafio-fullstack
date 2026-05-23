import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRefDto } from 'src/modules/projects/application/dtos/project.dto';
import { PaginationDto } from 'src/shared/pagination';

export const taskStatusSchema = z.enum([
  'pending',
  'in_progress',
  'testing',
  'done',
]);
export type TaskStatus = z.infer<typeof taskStatusSchema>;

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Título obrigatório').max(255),
  description: z.string().max(5000).optional(),
  projectId: z.string().uuid('projectId deve ser UUID válido'),
  status: taskStatusSchema.default('pending'),
  assignedToUserId: z.string().uuid().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
  projectId: z.string().uuid().optional(),
  assignedToUserId: z.string().uuid().nullable().optional(),
  updatedByUserId: z.string().uuid().optional(),
});

export const changeStatusSchema = z.object({
  status: taskStatusSchema,
});

export const moveTaskSchema = z.object({
  status: taskStatusSchema,
  afterId: z.string().uuid().optional(),
});

export const reorderTaskSchema = z.object({
  afterId: z.string().uuid().optional(),
  beforeId: z.string().uuid().optional(),
});

export class CreateTaskDto {
  @ApiProperty({ example: 'Implementar login' })
  title: string;
  @ApiPropertyOptional({ example: 'Detalhes da tarefa' })
  description?: string;
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000000' })
  projectId: string;
  @ApiPropertyOptional({ enum: ['pending', 'in_progress', 'testing', 'done'] })
  status: TaskStatus;
  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000000' })
  assignedToUserId?: string;
}

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Implementar login' })
  title?: string;
  @ApiPropertyOptional({ example: 'Detalhes da tarefa' })
  description?: string;
  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000000' })
  projectId?: string;
  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000000' })
  assignedToUserId?: string | null;
}

export class ChangeStatusDto {
  @ApiProperty({ enum: ['pending', 'in_progress', 'testing', 'done'] })
  status: TaskStatus;
}

export class MoveTaskDto {
  @ApiProperty({ enum: ['pending', 'in_progress', 'testing', 'done'] })
  status: TaskStatus;
  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000000' })
  afterId?: string;
}

export class ReorderTaskDto {
  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000000' })
  afterId?: string;
  @ApiPropertyOptional({ example: '00000000-0000-0000-0000-000000000000' })
  beforeId?: string;
}

class ProjectRefDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
}

export class TaskResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiPropertyOptional() description: string | null;
  @ApiProperty() status: TaskStatus;
  @ApiProperty() position: number;
  @ApiProperty() project: ProjectRefDto;
  @ApiPropertyOptional() assignedTo: UserRefDto | null;
  @ApiProperty() createdBy: UserRefDto;
  @ApiPropertyOptional() updatedBy: UserRefDto | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class TaskListResponseDto {
  @ApiProperty({ type: [TaskResponseDto] }) data: TaskResponseDto[];
  @ApiProperty({ type: PaginationDto }) pagination: PaginationDto;
}
