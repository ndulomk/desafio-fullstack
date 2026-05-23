import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      // Se 401 e temos refresh token, tenta renovar uma vez
      if (err.status === 401 && auth.refreshToken()) {
        const refresh$ = auth.refresh();
        if (refresh$) {
          return refresh$.pipe(
            switchMap(() => next(req)),
            catchError((refreshErr) => {
              // Refresh também falhou → limpa sessão (o logout interno já faz isso)
              return throwError(() => refreshErr);
            })
          );
        }
      }
      return throwError(() => err);
    })
  );
};