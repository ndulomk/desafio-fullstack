import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TasksService } from './task.service';
import { CommentsService } from '../comments/comment.service';
import { ToastService } from '../../shared/toast.service';
import { ConfirmService } from '../../components/confirm-modal.component';
import { TaskFormComponent } from './task-form.component';
import type { Task, Comment } from '../../shared/models';

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pendente', cls: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  in_progress: { label: 'Em Progresso', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' },
  testing: { label: 'Teste', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400' },
  done: { label: 'Concluído', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
};

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [DatePipe, TaskFormComponent],
  template: `
    <div class="p-4 sm:p-6 max-w-3xl mx-auto">
      <button (click)="back()" class="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-4">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
        Voltar ao board
      </button>

      @if (loading()) {
        <div class="space-y-4">
          <div class="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
          <div class="h-48 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>
        </div>
      } @else if (task(); as t) {
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 mb-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-2 mb-2">
                <h1 class="text-lg font-bold text-gray-900 dark:text-white">{{ t.title }}</h1>
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium {{ STATUS_META[t.status].cls }}">{{ STATUS_META[t.status].label }}</span>
              </div>
              @if (t.description) {<p class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{{ t.description }}</p>}
              @else {<p class="text-sm text-gray-400 dark:text-gray-500 italic">Sem descrição</p>}
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button (click)="editTask()" class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                Editar
              </button>
              <button (click)="deleteTask()" class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                Eliminar
              </button>
            </div>
          </div>

          <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><dt class="text-[10px] font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-widest mb-1">Projeto</dt><dd class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ t.project.name }}</dd></div>
            <div><dt class="text-[10px] font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-widest mb-1">Atribuído a</dt><dd class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ t.assignedTo?.name || 'Ninguém' }}</dd></div>
            <div><dt class="text-[10px] font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-widest mb-1">Criado por</dt><dd class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ t.createdBy.name }}</dd></div>
            <div><dt class="text-[10px] font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-widest mb-1">Data</dt><dd class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ t.createdAt | date:'short' }}</dd></div>
          </div>
        </div>

        <!-- Comments -->
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
            Comentários ({{ comments().length }})
          </h3>

          <div class="flex gap-2 mb-5">
            <input [value]="newComment()" (input)="newComment.set($any($event.target).value)" (keyup.enter)="addComment()" placeholder="Escreve um comentário..."
              class="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-colors" />
            <button (click)="addComment()" [disabled]="!newComment().trim() || posting()"
              class="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-lg transition-colors">
              @if (posting()) {<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
              @else {<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>}
            </button>
          </div>

          <div class="space-y-3">
            @for (c of comments(); track c.id) {
              <div class="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 group">
                <div class="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 text-xs font-bold flex items-center justify-center shrink-0">{{ c.user.name[0] }}</div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-semibold text-gray-900 dark:text-white">{{ c.user.name }}</span>
                      <span class="text-[10px] text-gray-400">{{ c.createdAt | date:'shortTime' }}</span>
                    </div>
                    <button (click)="deleteComment(c.id)" class="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                  <p class="text-sm text-gray-700 dark:text-gray-300 mt-0.5">{{ c.content }}</p>
                </div>
              </div>
            } @empty {
              <div class="text-center py-6">
                <svg class="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                <p class="text-sm text-gray-400 dark:text-gray-600">Sem comentários ainda</p>
              </div>
            }
          </div>
        </div>
      }
    </div>

    @if (showEditForm()) {
      <app-task-form [task]="task()" (close)="showEditForm.set(false)" (saved)="onEditSaved()" />
    }
  `
})
export class TaskDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tasksApi = inject(TasksService);
  private commentsApi = inject(CommentsService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  task = signal<Task | null>(null);
  comments = signal<Comment[]>([]);
  loading = signal(true);
  posting = signal(false);
  showEditForm = signal(false);
  newComment = signal('');
  STATUS_META = STATUS_META;

  private taskId = this.route.snapshot.paramMap.get('id')!;

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.tasksApi.get(this.taskId).subscribe({
      next: t => { this.task.set(t); this.loadComments(); this.loading.set(false); },
      error: err => { this.loading.set(false); this.toast.error(err?.error?.message || 'Erro ao carregar tarefa'); }
    });
  }

  loadComments() {
    this.commentsApi.list(this.taskId).subscribe({
      next: res => this.comments.set(res.data || []),
      error: err => this.toast.error(err?.error?.message || 'Erro ao carregar comentários')
    });
  }

  addComment() {
    const content = this.newComment().trim();
    if (!content) return;
    this.posting.set(true);
    this.commentsApi.create(this.taskId, { content }).subscribe({
      next: c => { this.comments.update(list => [c, ...list]); this.newComment.set(''); this.posting.set(false); this.toast.success('Comentário adicionado'); },
      error: err => { this.posting.set(false); this.toast.error(err?.error?.message || 'Erro ao adicionar'); }
    });
  }

  async deleteComment(id: string) {
    const ok = await this.confirm.ask({
      title: 'Eliminar Comentário',
      message: 'Tens a certeza que queres eliminar este comentário?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;
    this.commentsApi.delete(this.taskId, id).subscribe({
      next: () => { this.comments.update(list => list.filter(c => c.id !== id)); this.toast.success('Comentário eliminado'); },
      error: err => this.toast.error(err?.error?.message || 'Erro ao eliminar')
    });
  }

  async deleteTask() {
    const ok = await this.confirm.ask({
      title: 'Eliminar Tarefa',
      message: 'Tens a certeza que queres eliminar esta tarefa? Esta ação não pode ser desfeita.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;
    this.tasksApi.delete(this.taskId).subscribe({
      next: () => { this.toast.success('Tarefa eliminada'); this.back(); },
      error: err => this.toast.error(err?.error?.message || 'Erro ao eliminar')
    });
  }

  editTask() { this.showEditForm.set(true); }
  onEditSaved() { this.showEditForm.set(false); this.load(); this.toast.success('Tarefa atualizada'); }
  back() { this.router.navigate(['/kanban']); }
}
