import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from 'src/shared/pagination';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(150, 'Nome demasiado longo'),
  description: z.string().max(2000, 'Descrição demasiado longa').optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  description: z.string().max(2000).optional(),
});

export class CreateProjectDto {
  @ApiProperty({ example: 'Mamboo Website' })
  name: string;
  @ApiPropertyOptional({ example: 'Site institucional' })
  description?: string;
}

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'Mamboo Website' })
  name?: string;
  @ApiPropertyOptional({ example: 'Site institucional' })
  description?: string;
}

export class UserRefDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() email: string;
  @ApiProperty() role: string;
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: Date;
}

export class ProjectResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() description: string | null;
  @ApiProperty() createdBy: UserRefDto;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class ProjectListResponseDto {
  @ApiProperty({ type: [ProjectResponseDto] }) data: ProjectResponseDto[];
  @ApiProperty({ type: PaginationDto }) pagination: PaginationDto;
}
