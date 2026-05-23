import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../modules/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, RouterOutlet],
  template: `
    <!-- Bottom Nav (mobile) -->
    <nav class="fixed bottom-0 inset-x-0 z-50 md:hidden
                bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm
                border-t border-gray-200 dark:border-gray-800
                safe-area-pb">
      <div class="flex items-center justify-around h-16 px-2">

        <!-- Projetos -->
        <a routerLink="/projects" routerLinkActive="text-orange-600 dark:text-orange-400"
          [routerLinkActiveOptions]="{exact:false}"
          class="flex flex-col items-center gap-1 px-4 py-2 rounded-xl
                 text-gray-500 dark:text-gray-400 transition-colors
                 [&.text-orange-600]:bg-orange-50 [&.text-orange-600]:dark:bg-orange-500/10">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
          <span class="text-[10px] font-medium">Projetos</span>
        </a>

        <!-- Kanban -->
        <a routerLink="/kanban" routerLinkActive="text-orange-600 dark:text-orange-400"
          [routerLinkActiveOptions]="{exact:false}"
          class="flex flex-col items-center gap-1 px-4 py-2 rounded-xl
                 text-gray-500 dark:text-gray-400 transition-colors
                 [&.text-orange-600]:bg-orange-50 [&.text-orange-600]:dark:bg-orange-500/10">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"/>
          </svg>
          <span class="text-[10px] font-medium">Kanban</span>
        </a>

        <!-- Logout -->
        <button (click)="logout()"
          class="flex flex-col items-center gap-1 px-4 py-2 rounded-xl
                 text-gray-500 dark:text-gray-400 transition-colors
                 hover:text-red-500 dark:hover:text-red-400">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          <span class="text-[10px] font-medium">Sair</span>
        </button>
      </div>
    </nav>

    <!-- Sidebar (desktop) -->
    <aside class="hidden md:flex fixed left-0 top-0 bottom-0 w-60 flex-col
                  bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40">
      <!-- Logo -->
      <div class="p-5 border-b border-gray-200 dark:border-gray-800">
        <div class="flex items-center gap-3">
          <span class="font-bold text-sm tracking-wider text-gray-900 dark:text-white uppercase">Mamboo</span>
        </div>
      </div>

      <!-- Nav links -->
      <nav class="flex-1 p-3 space-y-1">
        <a routerLink="/projects" routerLinkActive="bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400"
          [routerLinkActiveOptions]="{exact:false}"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <svg class="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
          Projetos
        </a>
        <a routerLink="/kanban" routerLinkActive="bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400"
          [routerLinkActiveOptions]="{exact:false}"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          <svg class="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7"/>
          </svg>
          Kanban
        </a>
      </nav>

      <!-- User + logout -->
      <div class="p-3 border-t border-gray-200 dark:border-gray-800">
        <div class="flex items-center gap-3 px-3 py-2 mb-1">
          <div class="w-7 h-7 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-700 dark:text-orange-400 text-xs font-bold shrink-0">
            {{ userInitial() }}
          </div>
          <div class="min-w-0">
            <p class="text-xs font-semibold text-gray-900 dark:text-white truncate">{{ userName() }}</p>
            <p class="text-[10px] text-gray-400 truncate">{{ userEmail() }}</p>
          </div>
        </div>
        <button (click)="logout()"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          Encerrar sessão
        </button>
      </div>
    </aside>

    <!-- Main content area -->
    <main class="flex-1 md:ml-60 pb-16 md:pb-0">
      <router-outlet />
    </main>
  `,
})
export class BottomNavComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  userInitial = () => this.auth.currentUser()?.name?.charAt(0).toUpperCase() ?? 'U';
  userName = () => this.auth.currentUser()?.name ?? '';
  userEmail = () => this.auth.currentUser()?.email ?? '';

  logout() {
    this.auth.logout().subscribe(() => this.router.navigate(['/auth/login']));
  }
}