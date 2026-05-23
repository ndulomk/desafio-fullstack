import { Component, inject, Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
}

let globalResolve: ((value: boolean) => void) | null = null;

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  visible = signal(false);
  title = signal('');
  message = signal('');
  confirmText = signal('Confirmar');
  cancelText = signal('Cancelar');
  variant = signal<'danger' | 'warning'>('danger');

  ask(options: ConfirmOptions): Promise<boolean> {
    this.title.set(options.title);
    this.message.set(options.message);
    this.confirmText.set(options.confirmText ?? 'Confirmar');
    this.cancelText.set(options.cancelText ?? 'Cancelar');
    this.variant.set(options.variant ?? 'danger');
    this.visible.set(true);

    return new Promise((resolve) => {
      globalResolve = resolve;
    });
  }

  confirm() {
    this.visible.set(false);
    globalResolve?.(true);
    globalResolve = null;
  }

  cancel() {
    this.visible.set(false);
    globalResolve?.(false);
    globalResolve = null;
  }
}

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  template: `
    @if (svc.visible()) {
      <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
           (click)="svc.cancel()">
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 w-full max-w-sm shadow-xl p-5"
             (click)="$event.stopPropagation()">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                 [class.bg-red-100]="svc.variant() === 'danger'"
                 [class.dark:bg-red-500/20]="svc.variant() === 'danger'"
                 [class.bg-amber-100]="svc.variant() === 'warning'"
                 [class.dark:bg-amber-500/20]="svc.variant() === 'warning'">
              <svg class="w-5 h-5"
                   [class.text-red-600]="svc.variant() === 'danger'"
                   [class.text-amber-600]="svc.variant() === 'warning'"
                   fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">{{ svc.title() }}</h3>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-5">{{ svc.message() }}</p>
          <div class="flex gap-3">
            <button (click)="svc.cancel()"
              class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              {{ svc.cancelText() }}
            </button>
            <button (click)="svc.confirm()"
              class="flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors"
              [class.bg-red-600]="svc.variant() === 'danger'"
              [class.hover:bg-red-700]="svc.variant() === 'danger'"
              [class.bg-amber-600]="svc.variant() === 'warning'"
              [class.hover:bg-amber-700]="svc.variant() === 'warning'">
              {{ svc.confirmText() }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ConfirmModalComponent {
  svc = inject(ConfirmService);
}
