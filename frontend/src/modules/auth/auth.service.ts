import { inject, Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { ApiService } from '../../shared/api';
import type { AuthResponse, LoginDto, RegisterDto, RefreshDto, User } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly #api = inject(ApiService);
  readonly #router = inject(Router);

  // Estado reactivo — lê do localStorage para sobreviver ao refresh
  readonly currentUser = signal<User | null>(
    JSON.parse(localStorage.getItem('user') ?? 'null')
  );
  readonly refreshToken = signal<string | null>(
    localStorage.getItem('refreshToken')
  );

  readonly isAuthenticated = computed(() => !!this.currentUser());
  readonly isAdmin = computed(() => this.currentUser()?.role === 'admin');

  // POST /auth/register
  register(dto: RegisterDto) {
    return this.#api.post<AuthResponse>('/auth/register', dto).pipe(
      tap((res) => this.#setSession(res))
    );
  }

  // POST /auth/login
  login(dto: LoginDto) {
    return this.#api.post<AuthResponse>('/auth/login', dto).pipe(
      tap((res) => this.#setSession(res))
    );
  }

  // POST /auth/refresh
  refresh() {
    const token = this.refreshToken();
    if (!token) return;
    const dto: RefreshDto = { refreshToken: token };
    return this.#api.post<AuthResponse>('/auth/refresh', dto).pipe(
      tap((res) => this.#setSession(res))
    );
  }

  // POST /auth/logout
  logout() {
    return this.#api.post<{ message: string }>('/auth/logout', {}).pipe(
      tap(() => this.#clearSession())
    );
  }

  #setSession(res: AuthResponse) {
    this.currentUser.set(res.user);
    this.refreshToken.set(res.refreshToken);
    localStorage.setItem('user', JSON.stringify(res.user));
    localStorage.setItem('refreshToken', res.refreshToken);
  }

  #clearSession() {
    this.currentUser.set(null);
    this.refreshToken.set(null);
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    this.#router.navigate(['/login']);
  }
}