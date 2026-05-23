import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="fixed top-4 right-4 z-[60] space-y-2 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium animate-[slideIn_0.2s_ease-out]"
          [class.bg-emerald-50]="toast.type === 'success'"
          [class.border-emerald-200]="toast.type === 'success'"
          [class.text-emerald-700]="toast.type === 'success'"
          [class.dark:bg-emerald-500/10]="toast.type === 'success'"
          [class.dark:border-emerald-500/20]="toast.type === 'success'"
          [class.dark:text-emerald-400]="toast.type === 'success'"
          [class.bg-red-50]="toast.type === 'error'"
          [class.border-red-200]="toast.type === 'error'"
          [class.text-red-700]="toast.type === 'error'"
          [class.dark:bg-red-500/10]="toast.type === 'error'"
          [class.dark:border-red-500/20]="toast.type === 'error'"
          [class.dark:text-red-400]="toast.type === 'error'"
          [class.bg-blue-50]="toast.type === 'info'"
          [class.border-blue-200]="toast.type === 'info'"
          [class.text-blue-700]="toast.type === 'info'"
          [class.dark:bg-blue-500/10]="toast.type === 'info'"
          [class.dark:border-blue-500/20]="toast.type === 'info'"
          [class.dark:text-blue-400]="toast.type === 'info'">
          @if (toast.type === 'success') {
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          } @else if (toast.type === 'error') {
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          } @else {
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          }
          <span>{{ toast.message }}</span>
          <button (click)="toastService.remove(toast.id)" class="ml-2 opacity-60 hover:opacity-100">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`@keyframes slideIn { from { transform: translateX(100%); opacity:0 } to { transform: translateX(0); opacity:1 } }`]
})
export class ToastComponent {
  toastService = inject(ToastService);
}
