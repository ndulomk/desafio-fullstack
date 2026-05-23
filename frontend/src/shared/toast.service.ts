import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private idCounter = 0;

  private add(message: string, type: Toast['type']) {
    const id = ++this.idCounter;
    this.toasts.update(list => [...list, { id, message, type }]);
    setTimeout(() => this.remove(id), 4000);
  }

  success(message: string) { this.add(message, 'success'); }
  error(message: string) { this.add(message, 'error'); }
  info(message: string) { this.add(message, 'info'); }

  remove(id: number) {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
