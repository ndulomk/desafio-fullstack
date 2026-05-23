import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const SECRET = process.env.JWT_SECRET ?? 'change-me';

export interface JwtPayload {
  userId: string;
  role: 'user' | 'admin';
  type: 'user' | 'user_refresh';
  sessionId?: string;
}

export function signToken(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  expiresInSec: number,
): string {
  return jwt.sign({ ...payload, jwtid: randomUUID() }, SECRET, {
    expiresIn: expiresInSec,
  });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, SECRET) as JwtPayload;
  } catch {
    return null;
  }
}
