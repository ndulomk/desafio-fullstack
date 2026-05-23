import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  template: `
    <div
      class="min-h-screen bg-white text-gray-900
             flex flex-col items-center justify-center p-4
             selection:bg-orange-500/30 selection:text-orange-200
             transition-colors duration-300 relative"
    >
      <!-- Background Decorativo -->
      <div class="fixed inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-[20%] left-[20%] w-[40%] h-[40%]
                    bg-orange-500/5 rounded-full blur-3xl"></div>
        <div class="absolute top-[40%] -right-[10%] w-[30%] h-[30%]
                    bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>
      <div class="mb-6 flex flex-col items-center z-10">
        <span class="text-sm font-bold tracking-wider text-gray-900 uppercase">MAMBOO</span>
      </div>

      <!-- Card principal -->
      <div
        class="w-full max-w-[400px] bg-white rounded-xl
               border border-gray-200
               shadow-[0_1px_2px_rgba(0,0,0,0.05)] p-6 relative overflow-hidden z-10
               animate-[fadeIn_.25s_ease]"
      >
        <router-outlet />
      </div>

      <!-- Links legais -->
      <div class="mt-6 flex justify-center gap-4 text-[10px] text-gray-400
                  uppercase tracking-wide font-medium z-10">
        <a href="#" class="hover:text-gray-600 transition-colors">Termos</a>
        <a href="#" class="hover:text-gray-600 transition-colors">Privacidade</a>
        <a href="#" class="hover:text-gray-600 transition-colors">Ajuda</a>
      </div>
    </div>
  `,
})
export class AuthLayoutComponent { }
