import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from 'src/shared/pagination';

// ── Zod schemas ───────────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100)
    .optional(),
});

export const updateRoleSchema = z.object({
  role: z.enum(['user', 'admin']),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'João Silva' })
  name?: string;
}

export class UpdateRoleDto {
  @ApiProperty({ enum: ['user', 'admin'] })
  role: 'user' | 'admin';
}

// ── Response classes for Swagger ─────────────────────────────────────────────

export class UserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() email: string;
  @ApiProperty() role: 'user' | 'admin';
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: Date;
}

export class UserListResponseDto {
  @ApiProperty({ type: [UserResponseDto] }) data: UserResponseDto[];
  @ApiProperty({ type: PaginationDto }) pagination: PaginationDto;
}
