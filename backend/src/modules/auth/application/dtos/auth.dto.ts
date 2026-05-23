import { z } from 'zod';
import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from 'src/modules/users/application/dtos/user.dto';

// ── Zod schemas ───────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Password deve ter pelo menos 8 caracteres')
    .max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Password obrigatória'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token obrigatório'),
});

// ── DTO classes for Swagger ───────────────────────────────────────────────────

export class RegisterDto {
  @ApiProperty({ example: 'João Silva' })
  name: string;
  @ApiProperty({ example: 'joao@example.com' })
  email: string;
  @ApiProperty({ example: 'password123' })
  password: string;
}

export class LoginDto {
  @ApiProperty({ example: 'joao@example.com' })
  email: string;
  @ApiProperty({ example: 'password123' })
  password: string;
}

export class RefreshDto {
  @ApiProperty({ example: 'refresh-token-string' })
  refreshToken: string;
}

// ── Response classes for Swagger ───────────────────────────────────────────

export class AuthResponseDto {
  @ApiProperty({ type: String }) accessToken: string;
  @ApiProperty({ type: String }) refreshToken: string;
  @ApiProperty({ type: () => UserResponseDto }) user: UserResponseDto;
}
