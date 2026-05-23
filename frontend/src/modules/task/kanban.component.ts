import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TasksService } from './task.service';
import { ProjectsService } from '../projects/project.service';
import { ToastService } from '../../shared/toast.service';
import { ConfirmService } from '../../components/confirm-modal.component';
import { TaskFormComponent } from './task-form.component';
import type { Task, TaskStatus, Project } from '../../shared/models';

const COLUMNS: { key: TaskStatus; label: string; color: string }[] = [
  { key: 'pending', label: 'Pendente', color: 'bg-gray-500' },
  { key: 'in_progress', label: 'Em Progresso', color: 'bg-blue-500' },
  { key: 'testing', label: 'Teste', color: 'bg-purple-500' },
  { key: 'done', label: 'Concluído', color: 'bg-emerald-500' },
];

  @Component({
  selector: 'app-kanban',
  standalone: true,
  imports: [RouterLink, DragDropModule, TaskFormComponent],
  template: `
    <div class="p-4 sm:p-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">Quadro Kanban</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Arrasta as tarefas entre colunas</p>
        </div>
        <div class="flex items-center gap-2">
          <select [value]="selectedProjectId()" (change)="filterByProject($any($event.target).value)"
            class="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500/30">
            <option value="">Todos os projetos</option>
            @for (p of projects(); track p.id) {<option [value]="p.id">{{ p.name }}</option>}
          </select>
          <button (click)="openTaskForm()"
            class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors shrink-0">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            <span class="hidden sm:inline">Nova Tarefa</span>
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (i of [1,2,3,4]; track i) {<div class="h-96 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>}
        </div>
      } @else {
        <div class="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-4 lg:overflow-visible">
          @for (col of columns; track col.key) {
            <div class="min-w-[280px] sm:min-w-[320px] lg:min-w-0 flex-1 flex flex-col bg-gray-100/50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800">
              <div class="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between rounded-t-xl">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full {{ col.color }}"></span>
                  <h3 class="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{{ col.label }}</h3>
                  <span class="px-1.5 py-0.5 text-[10px] font-bold bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">{{ tasksByStatus()[col.key].length }}</span>
                </div>
              </div>

              <div cdkDropList [cdkDropListData]="tasksByStatus()[col.key]" [cdkDropListConnectedTo]="dropListIds()" [id]="'list-' + col.key"
                (cdkDropListDropped)="onDrop($event)"
                class="p-2 flex-1 min-h-[200px] space-y-2 transition-colors"
                [class.bg-orange-500/5]="dragOverColumn() === col.key"
                (cdkDropListEntered)="dragOverColumn.set(col.key)"
                (cdkDropListExited)="dragOverColumn.set(null)">

                @for (task of tasksByStatus()[col.key]; track task.id) {
                  <div cdkDrag [cdkDragData]="task"
                    class="group bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing active:scale-[0.98]"
                    [class.ring-2]="draggingTaskId() === task.id"
                    [class.ring-orange-500]="draggingTaskId() === task.id">

                    <div *cdkDragPreview class="bg-white rounded-lg border border-gray-200 p-3 shadow-xl w-[240px]">
                      <div class="flex items-start justify-between gap-2 mb-2">
                        <h4 class="text-sm font-semibold text-gray-900 line-clamp-2">{{ task.title }}</h4>
                      </div>
                      @if (task.description) {
                        <p class="text-xs text-gray-500 line-clamp-2 mb-2">{{ task.description }}</p>
                      }
                      <div class="flex items-center justify-between mt-2">
                        <div class="flex items-center gap-1.5">
                          @if (task.assignedTo) {
                            <div class="w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold flex items-center justify-center">{{ task.assignedTo.name[0] }}</div>
                          }
                        </div>
                      </div>
                    </div>
                    <div *cdkDragPlaceholder class="bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700"></div>

                    <div class="flex items-start justify-between gap-2 mb-2">
                      <h4 class="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">{{ task.title }}</h4>
                      <div class="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button (click)="$event.stopPropagation(); editTask(task)" class="p-1 text-gray-400 hover:text-orange-500 transition-colors" title="Editar">
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button (click)="$event.stopPropagation(); deleteTask(task.id)" class="p-1 text-gray-400 hover:text-red-500 transition-colors" title="Eliminar">
                          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </div>

                    @if (task.description) {<p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{{ task.description }}</p>}

                    <div class="flex items-center justify-between mt-2">
                      <div class="flex items-center gap-1.5">
                        @if (task.assignedTo) {
                          <div class="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400 text-[10px] font-bold flex items-center justify-center" [title]="task.assignedTo.name">{{ task.assignedTo.name[0] }}</div>
                        } @else {<span class="text-[10px] text-gray-400 dark:text-gray-600">Não atribuído</span>}
                      </div>
                      <a [routerLink]="['/tasks', task.id]" class="text-[10px] font-medium text-orange-600 dark:text-orange-400 hover:underline">Ver →</a>
                    </div>
                  </div>
                } @empty {
                  <div class="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                    <svg class="w-6 h-6 text-gray-200 dark:text-gray-700 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                    <p class="text-xs text-gray-400 dark:text-gray-600">Vazio</p>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>

    @if (showForm()) {
      <app-task-form 
        [task]="taskToEdit()"
        [projectId]="selectedProjectId()"
        (close)="closeForm()" 
        (saved)="onTaskSaved()" />
    }
  `,
  styles: [`
    .cdk-drag-preview { box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2); border-radius: 0.75rem; background: white; padding: 0.75rem; border: 1px solid #e5e7eb; }
    .dark .cdk-drag-preview { background: #111827; border-color: #1f2937; }
    .cdk-drag-placeholder { opacity: 0.4; }
    .cdk-drag-animating { transition: transform 250ms cubic-bezier(0, 0, 0.2, 1); }
    .cdk-drop-list-dragging .cdk-drag { transition: transform 250ms cubic-bezier(0, 0, 0.2, 1); }
  `]
})
export class KanbanComponent implements OnInit {
  private tasksApi = inject(TasksService);
  private projectsApi = inject(ProjectsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  columns = COLUMNS;
  tasks = signal<Task[]>([]);
  projects = signal<Project[]>([]);
  loading = signal(true);
  selectedProjectId = signal<string>('');
  showForm = signal(false);
  taskToEdit = signal<Task | null>(null);
  dragOverColumn = signal<string | null>(null);
  draggingTaskId = signal<string | null>(null);

  dropListIds = computed(() => this.columns.map(c => 'list-' + c.key));

  tasksByStatus = computed(() => {
    const map: Record<TaskStatus, Task[]> = { pending: [], in_progress: [], testing: [], done: [] };
    this.tasks().forEach(t => { map[t.status].push(t); });
    return map;
  });

  ngOnInit() {
    this.projectsApi.list().subscribe({
      next: res => this.projects.set(res.data || []),
      error: err => this.toast.error(err?.error?.message || 'Erro ao carregar projetos')
    });
    this.route.queryParams.subscribe(p => {
      this.selectedProjectId.set(p['projectId'] || '');
      this.load();
    });
  }

  load() {
    this.loading.set(true);
    const params = this.selectedProjectId() ? { projectId: this.selectedProjectId() } : undefined;
    this.tasksApi.list(params).subscribe({
      next: res => { this.tasks.set(res.data); this.loading.set(false); },
      error: err => { this.loading.set(false); this.toast.error(err?.error?.message || 'Erro ao carregar tarefas'); }
    });
  }

  filterByProject(id: string) {
    this.router.navigate([], { relativeTo: this.route, queryParams: id ? { projectId: id } : {} });
  }

  openTaskForm() { this.taskToEdit.set(null); this.showForm.set(true); }
  editTask(task: Task) { this.taskToEdit.set(task); this.showForm.set(true); }
  closeForm() { this.showForm.set(false); this.taskToEdit.set(null); }

  onTaskSaved() {
    this.closeForm();
    this.load();
    this.toast.success(this.taskToEdit() ? 'Tarefa atualizada' : 'Tarefa criada');
  }

  onDrop(event: CdkDragDrop<Task[]>) {
    const newStatus = (event.container.id.replace('list-', '') || 'pending') as TaskStatus;
    const task = event.item.data as Task;

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      // Optimistic + API
      this.tasks.update(list => list.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      this.tasksApi.changeStatus(task.id, newStatus).subscribe({
        next: () => this.toast.success(`Movido para ${this.columns.find(c => c.key === newStatus)?.label}`),
        error: (err: any) => {
          this.toast.error(err?.error?.message || 'Erro ao mover tarefa');
          this.load(); // rollback
        }
      });
    }
    this.dragOverColumn.set(null);
  }

  async deleteTask(id: string) {
    const ok = await this.confirm.ask({
      title: 'Eliminar Tarefa',
      message: 'Tens a certeza que queres eliminar esta tarefa? Esta ação não pode ser desfeita.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;
    this.tasksApi.delete(id).subscribe({
      next: () => { this.toast.success('Tarefa eliminada'); this.load(); },
      error: err => this.toast.error(err?.error?.message || 'Erro ao eliminar')
    });
  }
}
