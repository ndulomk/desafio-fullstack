import { Component, inject, input, output, signal, OnInit, effect } from '@angular/core';
import { TasksService } from './task.service';
import { ProjectsService } from '../projects/project.service';
import { ToastService } from '../../shared/toast.service';
import type { Project, Task, TaskStatus } from '../../shared/models';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [],
  template: `
    <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm" (click)="close.emit()">
      <div class="bg-white dark:bg-gray-900 rounded-t-xl sm:rounded-xl border border-gray-200 dark:border-gray-800 w-full sm:max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
        <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">{{ isEdit() ? 'Editar Tarefa' : 'Nova Tarefa' }}</h3>
          <button (click)="close.emit()" class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="p-5 space-y-4">
          @if (error()) {
            <div class="px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
              {{ error() }}
            </div>
          }

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Título <span class="text-red-500">*</span></label>
            <input [value]="title()" (input)="title.set($any($event.target).value)" placeholder="Ex: Implementar login"
              class="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-colors" />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descrição</label>
            <textarea [value]="description()" (input)="description.set($any($event.target).value)" rows="3" placeholder="Detalhes da tarefa..."
              class="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-colors resize-none"></textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Projeto <span class="text-red-500">*</span></label>
              <select [value]="selectedProjectId()" (change)="selectedProjectId.set($any($event.target).value)"
                class="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-colors">
                <option value="">Seleciona...</option>
                @for (p of projects(); track p.id) {<option [value]="p.id">{{ p.name }}</option>}
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
              <select [value]="status()" (change)="onStatusChange($any($event.target).value)"
                class="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-colors">
                <option value="pending">Pendente</option>
                <option value="in_progress">Em Progresso</option>
                <option value="testing">Teste</option>
                <option value="done">Concluído</option>
              </select>
            </div>
          </div>
        </div>

        <div class="flex gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <button (click)="close.emit()" class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
          <button (click)="submit()" [disabled]="saving()"
            class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-lg transition-colors">
            {{ saving() ? (isEdit() ? 'A atualizar...' : 'A criar...') : (isEdit() ? 'Atualizar' : 'Criar Tarefa') }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class TaskFormComponent implements OnInit {
  private tasksApi = inject(TasksService);
  private projectsApi = inject(ProjectsService);
  private toast = inject(ToastService);

  task = input<Task | null>(null);
  projectId = input<string>('');
  close = output<void>();
  saved = output<void>();

  projects = signal<Project[]>([]);
  saving = signal(false);
  error = signal('');
  isEdit = signal(false);

  title = signal('');
  description = signal('');
  selectedProjectId = signal('');
  status = signal<TaskStatus>('pending');

  constructor() {
    effect(() => {
      const t = this.task();
      if (t) {
        this.isEdit.set(true);
        this.title.set(t.title);
        this.description.set(t.description || '');
        this.selectedProjectId.set(t.project.id);
        this.status.set(t.status);
      } else {
        this.isEdit.set(false);
        this.reset();
      }
    });
  }

  ngOnInit() {
    this.projectsApi.list().subscribe({
      next: res => {
        this.projects.set(res.data || []);
        const pid = this.projectId();
        if (pid && !this.isEdit()) this.selectedProjectId.set(pid);
      },
      error: err => this.toast.error(err?.error?.message || 'Erro ao carregar projetos')
    });
  }

  onStatusChange(value: string) {
    this.status.set(value as TaskStatus);
  }

  reset() {
    this.title.set('');
    this.description.set('');
    this.selectedProjectId.set(this.projectId() || '');
    this.status.set('pending');
  }

  submit() {
    if (!this.title().trim() || !this.selectedProjectId()) {
      this.error.set('Preenche os campos obrigatórios.');
      return;
    }
    this.saving.set(true);
    this.error.set('');

    const payload = {
      title: this.title().trim(),
      description: this.description().trim() || undefined,
      projectId: this.selectedProjectId(),
      status: this.status()
    };

    const t = this.task();
    if (t) {
      this.tasksApi.update(t.id, payload).subscribe({
        next: () => { this.saved.emit(); this.saving.set(false); },
        error: (err) => { this.error.set(err?.error?.message || 'Erro ao atualizar'); this.saving.set(false); }
      });
    } else {
      this.tasksApi.create(payload).subscribe({
        next: () => { this.saved.emit(); this.saving.set(false); },
        error: (err) => { this.error.set(err?.error?.message || 'Erro ao criar'); this.saving.set(false); }
      });
    }
  }
}
