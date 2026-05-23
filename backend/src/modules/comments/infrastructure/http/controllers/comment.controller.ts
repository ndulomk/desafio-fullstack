import {
  Controller,
  Get,
  Post,
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
import { CommentsService } from 'src/modules/comments/application/services/comment.service';
import {
  createCommentSchema,
  type CreateCommentDto,
  CommentResponseDto,
  CommentListResponseDto,
} from '../../../application/dtos/comment.dto';
import { JwtAuthGuard } from 'src/middlewares/auth.middleware';
import { CurrentUser } from 'src/decorators/decorator';
import { ZodValidationPipe } from 'src/shared/zod/zod-validation-pipe';
import type { RequestUser } from 'src/middlewares/auth.middleware';

@ApiTags('comments')
@ApiCookieAuth('auth_token')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks/:taskId/comments')
export class CommentsController {
  constructor(private readonly svc: CommentsService) {}

  // GET /api/v1/tasks/:taskId/comments
  @Get()
  @ApiOperation({ summary: 'Listar comentários da task' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: CommentListResponseDto })
  findAll(
    @Param('taskId') taskId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.svc.findByTask(taskId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  // POST /api/v1/tasks/:taskId/comments
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adicionar comentário à task' })
  @ApiResponse({ status: 201, type: CommentResponseDto })
  create(
    @Param('taskId') taskId: string,
    @Body(new ZodValidationPipe(createCommentSchema)) dto: CreateCommentDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.svc.create(taskId, dto, user.userId);
  }

  // DELETE /api/v1/tasks/:taskId/comments/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar comentário' })
  async remove(
    @Param('taskId') taskId: string,
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ) {
    await this.svc.delete(id, taskId, user.userId, user.role);
  }
}
