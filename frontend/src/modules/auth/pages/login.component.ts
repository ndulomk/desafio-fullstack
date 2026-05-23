import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="animate-[fadeInUp_.25s_ease]">

      <!-- Header -->
      <div class="text-center mb-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Bem-vindo de volta!</h2>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Gerencie seus projetos com segurança.</p>
      </div>

      <!-- Form -->
      <form (ngSubmit)="handleSubmit()" class="space-y-4">

        <!-- Email -->
        <div class="space-y-1.5">
          <div class="flex justify-between items-center">
            <label for="email" class="block text-xs font-semibold text-gray-700 dark:text-gray-300">Email</label>
            @if (errors()['email']) {
              <span class="text-[10px] text-red-500 font-medium animate-pulse">{{ errors()['email'] }}</span>
            }
          </div>
          <div class="relative flex items-center bg-white dark:bg-gray-950 border rounded-lg transition-colors duration-200"
               [class]="emailFocused() ? 'border-orange-500 ring-1 ring-orange-500' : (errors()['email'] ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-700')">
            <div class="pl-3 text-gray-400 dark:text-gray-500">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <input
              id="email" type="email" [(ngModel)]="formData.email" name="email"
              placeholder="seu@email.com" required
              (focus)="emailFocused.set(true)" (blur)="emailFocused.set(false)"
              class="w-full bg-transparent border-none py-2.5 px-3 text-sm
                     text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600
                     focus:ring-0 focus:outline-none"
            />
          </div>
        </div>

        <!-- Password -->
        <div class="space-y-1.5">
          <div class="flex justify-between items-center">
            <label for="password" class="block text-xs font-semibold text-gray-700 dark:text-gray-300">Senha</label>
            @if (errors()['password']) {
              <span class="text-[10px] text-red-500 font-medium animate-pulse">{{ errors()['password'] }}</span>
            }
          </div>
          <div class="relative flex items-center bg-white dark:bg-gray-950 border rounded-lg transition-colors duration-200"
               [class]="pwFocused() ? 'border-orange-500 ring-1 ring-orange-500' : (errors()['password'] ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-700')">
            <div class="pl-3 text-gray-400 dark:text-gray-500">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <input
              id="password" [type]="showPw() ? 'text' : 'password'"
              [(ngModel)]="formData.password" name="password"
              placeholder="••••••" required
              (focus)="pwFocused.set(true)" (blur)="pwFocused.set(false)"
              class="w-full bg-transparent border-none py-2.5 px-3 text-sm
                     text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600
                     focus:ring-0 focus:outline-none"
            />
            <button type="button" (click)="showPw.update(v => !v)"
              class="pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none">
              @if (showPw()) {
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                </svg>
              } @else {
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
              }
            </button>
          </div>
          <div class="flex justify-end">
            <a routerLink="/auth/recover"
              class="text-[11px] font-medium text-orange-600 hover:text-orange-700
                     dark:text-orange-400 dark:hover:text-orange-300 hover:underline">
              Esqueceu a senha?
            </a>
          </div>
        </div>

        <!-- General error -->
        @if (errors()['general']) {
          <div class="text-xs text-red-600 dark:text-red-400 text-center bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2">
            {{ errors()['general'] }}
          </div>
        }

        <!-- Submit -->
        <button
          type="submit"
          [disabled]="isLoading()"
          class="relative w-full h-10 flex items-center justify-center gap-2 rounded-lg
                 font-medium text-sm transition-all
                 bg-orange-600 hover:bg-orange-700 text-white shadow-sm
                 disabled:opacity-70 disabled:cursor-not-allowed
                 active:scale-[0.98] hover:scale-[1.01] mt-2"
        >
          @if (isLoading()) {
            <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          } @else {
            <span>Entrar</span>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          }
        </button>
      </form>

      <!-- Register link -->
      <div class="mt-6 text-center pt-4 border-t border-gray-100 dark:border-gray-700/50">
        <p class="text-xs text-gray-600 dark:text-gray-400">
          Novo por aqui?
          <a routerLink="/auth/register"
            class="ml-1 font-semibold text-orange-600 hover:text-orange-700
                   dark:text-orange-400 dark:hover:text-orange-300 transition-colors">
            Criar conta
          </a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  formData = { email: '', password: '' };
  errors = signal<Record<string, string>>({});
  isLoading = signal(false);
  showPw = signal(false);
  emailFocused = signal(false);
  pwFocused = signal(false);

  handleSubmit() {
    this.errors.set({});
    if (!this.formData.email) {
      this.errors.set({ email: 'Email obrigatório' });
      return;
    }
    if (!this.formData.password || this.formData.password.length < 6) {
      this.errors.set({ password: 'Mínimo 6 caracteres' });
      return;
    }
    this.isLoading.set(true);
    this.auth.login(this.formData).subscribe({
      next: () => this.router.navigate(['/kanban']),
      error: (err) => {
        this.errors.set({ general: err?.error?.message || 'Erro ao fazer login' });
        this.isLoading.set(false);
      },
      complete: () => this.isLoading.set(false),
    });
  }
}