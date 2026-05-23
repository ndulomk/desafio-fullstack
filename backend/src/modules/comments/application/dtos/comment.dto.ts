import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { UserRefDto } from 'src/modules/projects/application/dtos/project.dto';
import { PaginationDto } from 'src/shared/pagination';

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'Conteúdo obrigatório')
    .max(5000, 'Comentário demasiado longo'),
});

export class CreateCommentDto {
  @ApiProperty({ example: 'Vou começar hoje à tarde.' })
  content: string;
}

export class CommentResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() taskId: string;
  @ApiProperty() user: UserRefDto;
  @ApiProperty() content: string;
  @ApiProperty() createdAt: Date;
}

export class CommentListResponseDto {
  @ApiProperty({ type: [CommentResponseDto] }) data: CommentResponseDto[];
  @ApiProperty({ type: PaginationDto }) pagination: PaginationDto;
}
