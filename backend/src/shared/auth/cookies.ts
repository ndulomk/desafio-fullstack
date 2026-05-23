import { Response, Request } from 'express';

const ACCESS_TTL_SEC = 15 * 60; // 15 min

export function setAuthCookie(
  res: Response,
  req: Request,
  token: string,
): void {
  const isProd = process.env.NODE_ENV === 'production';
  const host = req.headers.host ?? '';
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

  const domain =
    isProd && !isLocalhost && host.includes('.')
      ? host.substring(host.indexOf('.') + 1)
      : undefined;

  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: ACCESS_TTL_SEC * 1000,
    path: '/',
    domain,
  });
}

export function clearAuthCookie(res: Response, req: Request): void {
  const isProd = process.env.NODE_ENV === 'production';
  const host = req.headers.host ?? '';
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

  const domain =
    isProd && !isLocalhost && host.includes('.')
      ? host.substring(host.indexOf('.') + 1)
      : undefined;

  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    domain,
  });
}
