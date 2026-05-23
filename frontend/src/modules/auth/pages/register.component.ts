import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="animate-[fadeInUp_.25s_ease]">
      <div class="text-center mb-8">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Crie sua conta</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Junte-se ao Mamboo hoje.</p>
      </div>

      <form (ngSubmit)="handleSubmit()" class="space-y-4">

        <!-- Nome -->
        <div class="space-y-1.5">
          <div class="flex justify-between items-center">
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300">Nome Completo</label>
            @if (errors()['name']) {
              <span class="text-[10px] text-red-500 font-medium animate-pulse">{{ errors()['name'] }}</span>
            }
          </div>
          <div class="relative flex items-center bg-white dark:bg-gray-950 border rounded-lg transition-colors"
               [class]="nameFocused() ? 'border-orange-500 ring-1 ring-orange-500' : 'border-gray-300 dark:border-gray-700'">
            <div class="pl-3 text-gray-400 dark:text-gray-500">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <input type="text" [(ngModel)]="formData.name" name="name"
              placeholder="Seu nome" required minlength="2"
              (focus)="nameFocused.set(true)" (blur)="nameFocused.set(false)"
              class="w-full bg-transparent border-none py-2.5 px-3 text-sm
                     text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600
                     focus:ring-0 focus:outline-none"/>
          </div>
        </div>

        <!-- Email -->
        <div class="space-y-1.5">
          <div class="flex justify-between items-center">
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300">Email</label>
            @if (errors()['email']) {
              <span class="text-[10px] text-red-500 font-medium animate-pulse">{{ errors()['email'] }}</span>
            }
          </div>
          <div class="relative flex items-center bg-white dark:bg-gray-950 border rounded-lg transition-colors"
               [class]="emailFocused() ? 'border-orange-500 ring-1 ring-orange-500' : 'border-gray-300 dark:border-gray-700'">
            <div class="pl-3 text-gray-400 dark:text-gray-500">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <input type="email" [(ngModel)]="formData.email" name="email"
              placeholder="seu@email.com" required
              (focus)="emailFocused.set(true)" (blur)="emailFocused.set(false)"
              class="w-full bg-transparent border-none py-2.5 px-3 text-sm
                     text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600
                     focus:ring-0 focus:outline-none"/>
          </div>
        </div>

        <!-- Password -->
        <div class="space-y-1.5">
          <div class="flex justify-between items-center">
            <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300">Senha</label>
            @if (errors()['password']) {
              <span class="text-[10px] text-red-500 font-medium animate-pulse">{{ errors()['password'] }}</span>
            }
          </div>
          <div class="relative flex items-center bg-white dark:bg-gray-950 border rounded-lg transition-colors"
               [class]="pwFocused() ? 'border-orange-500 ring-1 ring-orange-500' : 'border-gray-300 dark:border-gray-700'">
            <div class="pl-3 text-gray-400 dark:text-gray-500">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <input [type]="showPw() ? 'text' : 'password'" [(ngModel)]="formData.password" name="password"
              placeholder="Mínimo 6 caracteres" required minlength="6"
              (focus)="pwFocused.set(true)" (blur)="pwFocused.set(false)"
              class="w-full bg-transparent border-none py-2.5 px-3 text-sm
                     text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600
                     focus:ring-0 focus:outline-none"/>
            <button type="button" (click)="showPw.update(v => !v)"
              class="pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </button>
          </div>
        </div>

        @if (errors()['general']) {
          <div class="text-sm text-red-600 dark:text-red-400 text-center bg-red-50 dark:bg-red-500/10 rounded-lg px-3 py-2">
            {{ errors()['general'] }}
          </div>
        }

        <button type="submit" [disabled]="isLoading()"
          class="relative w-full h-10 flex items-center justify-center gap-2 rounded-lg
                 font-medium text-sm bg-orange-600 hover:bg-orange-700 text-white shadow-sm
                 disabled:opacity-70 active:scale-[0.98] hover:scale-[1.01] mt-2 transition-all">
          @if (isLoading()) {
            <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          } @else {
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>Criar Conta Grátis</span>
          }
        </button>
      </form>

      <div class="mt-8 text-center pt-6 border-t border-gray-100 dark:border-gray-800">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Já tem conta?
          <a routerLink="/auth/login"
            class="ml-1.5 font-semibold text-orange-600 hover:text-orange-700
                   dark:text-orange-400 dark:hover:text-orange-300 transition-colors">
            Fazer Login
          </a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  formData = { name: '', email: '', password: '' };
  errors = signal<Record<string, string>>({});
  isLoading = signal(false);
  showPw = signal(false);
  nameFocused = signal(false);
  emailFocused = signal(false);
  pwFocused = signal(false);

  handleSubmit() {
    this.errors.set({});
    if (!this.formData.name || this.formData.name.length < 2) {
      this.errors.set({ name: 'Mínimo 2 caracteres' }); return;
    }
    if (!this.formData.email) {
      this.errors.set({ email: 'Email obrigatório' }); return;
    }
    if (!this.formData.password || this.formData.password.length < 6) {
      this.errors.set({ password: 'Mínimo 6 caracteres' }); return;
    }
    this.isLoading.set(true);
    this.auth.register(this.formData).subscribe({
      next: () => this.router.navigate(['/kanban']),
      error: (err) => {
        this.errors.set({ general: err?.error?.message || 'Erro ao criar conta' });
        this.isLoading.set(false);
      },
      complete: () => this.isLoading.set(false),
    });
  }
}