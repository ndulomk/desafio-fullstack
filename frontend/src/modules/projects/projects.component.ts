import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ProjectsService } from './project.service';
import { ToastService } from '../../shared/toast.service';
import { ConfirmService } from '../../components/confirm-modal.component';
import type { Project } from '../../shared/models';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="p-4 sm:p-6">
      <div class="flex items-center justify-between mb-5">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">Projetos</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Gerencia os teus projetos</p>
        </div>
        <button (click)="openCreate.set(true)"
          class="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          <span class="hidden sm:inline">Novo Projeto</span>
          <span class="sm:hidden">Novo</span>
        </button>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div class="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit mb-3">
            <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
          </div>
          <p class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Total</p>
          <p class="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{{ projects().length }}</p>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">projetos</p>
        </div>
      </div>

      <!-- Mobile -->
      <div class="sm:hidden space-y-3">
        @if (loading()) {
          @for (i of [1,2,3]; track i) {<div class="h-20 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"></div>}
        } @else if (projects().length === 0) {
          <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
            <svg class="w-7 h-7 text-gray-200 dark:text-gray-700 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
            <p class="text-sm text-gray-400">Nenhum projeto encontrado</p>
          </div>
        } @else {
          <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
            @for (p of projects(); track p.id) {
              <div class="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <a [routerLink]="['/kanban']" [queryParams]="{ projectId: p.id }" class="flex-1 min-w-0">
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white">{{ p.name }}</h3>
                  @if (p.description) {<p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{{ p.description }}</p>}
                  <div class="mt-2 flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500">
                    <span>{{ p.createdBy.name }}</span><span>•</span><span>{{ p.createdAt | date:'shortDate' }}</span>
                  </div>
                </a>
                <div class="ml-3 flex items-center gap-1 shrink-0">
                  <button (click)="openEditProject(p)" class="p-2 text-gray-400 hover:text-orange-500 transition-colors">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button (click)="deleteProject(p.id, p.name)" class="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Desktop -->
      <div class="hidden sm:block border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-950">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Projeto</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Criado por</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Data</th>
              <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-900">
            @if (loading()) {
              @for (i of [1,2,3]; track i) {
                <tr><td class="px-4 py-3"><div class="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-3/4"></div></td><td class="px-4 py-3"><div class="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-20"></div></td><td class="px-4 py-3"><div class="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-16"></div></td><td></td></tr>
              }
            } @else if (projects().length === 0) {
              <tr><td colspan="4"><div class="py-12 text-center text-sm text-gray-400">Nenhum projeto</div></td></tr>
            } @else {
              @for (p of projects(); track p.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                  <td class="px-4 py-3">
                    <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ p.name }}</p>
                    @if (p.description) {<p class="text-xs text-gray-500 dark:text-gray-400">{{ p.description }}</p>}
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{{ p.createdBy.name }}</td>
                  <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-500">{{ p.createdAt | date:'shortDate' }}</td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <a [routerLink]="['/kanban']" [queryParams]="{ projectId: p.id }" class="text-xs font-medium text-orange-600 dark:text-orange-400 hover:underline">Ver board →</a>
                      <button (click)="openEditProject(p)" class="p-1 text-gray-400 hover:text-orange-500 transition-colors">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button (click)="deleteProject(p.id, p.name)" class="p-1 text-gray-400 hover:text-red-500 transition-colors">
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </div>

    @if (openCreate()) {
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm" (click)="openCreate.set(false)">
        <div class="bg-white dark:bg-gray-900 rounded-t-xl sm:rounded-xl border border-gray-200 dark:border-gray-800 w-full sm:max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Novo Projeto</h3>
            <button (click)="openCreate.set(false)" class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="p-5 space-y-4">
            @if (createError()) {
              <div class="px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                {{ createError() }}
              </div>
            }

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome <span class="text-red-500">*</span></label>
              <input [value]="createName()" (input)="createName.set($any($event.target).value)" placeholder="Ex: Mamboo Website"
                class="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-colors" />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descrição</label>
              <textarea [value]="createDescription()" (input)="createDescription.set($any($event.target).value)" rows="3" placeholder="Detalhes do projeto..."
                class="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-colors resize-none"></textarea>
            </div>
          </div>

          <div class="flex gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <button (click)="openCreate.set(false)" class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
            <button (click)="submitCreate()" [disabled]="creating()"
              class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-lg transition-colors">
              {{ creating() ? 'A criar...' : 'Criar Projeto' }}
            </button>
          </div>
        </div>
      </div>
    }

    @if (openEdit()) {
      <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm" (click)="openEdit.set(false)">
        <div class="bg-white dark:bg-gray-900 rounded-t-xl sm:rounded-xl border border-gray-200 dark:border-gray-800 w-full sm:max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Editar Projeto</h3>
            <button (click)="openEdit.set(false)" class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <svg class="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          <div class="p-5 space-y-4">
            @if (editError()) {
              <div class="px-3 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                {{ editError() }}
              </div>
            }

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nome <span class="text-red-500">*</span></label>
              <input [value]="editName()" (input)="editName.set($any($event.target).value)" placeholder="Ex: Mamboo Website"
                class="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-colors" />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descrição</label>
              <textarea [value]="editDescription()" (input)="editDescription.set($any($event.target).value)" rows="3" placeholder="Detalhes do projeto..."
                class="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 transition-colors resize-none"></textarea>
            </div>
          </div>

          <div class="flex gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <button (click)="openEdit.set(false)" class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancelar</button>
            <button (click)="submitEdit()" [disabled]="editing()"
              class="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-lg transition-colors">
              {{ editing() ? 'A guardar...' : 'Guardar Alterações' }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ProjectsComponent implements OnInit {
  private api = inject(ProjectsService);
  private toast = inject(ToastService);
  private confirm = inject(ConfirmService);

  projects = signal<Project[]>([]);
  loading = signal(true);
  openCreate = signal(false);
  creating = signal(false);
  createError = signal('');

  createName = signal('');
  createDescription = signal('');

  // Edit
  openEdit = signal(false);
  editing = signal(false);
  editError = signal('');
  editId = signal('');
  editName = signal('');
  editDescription = signal('');

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (res) => { this.projects.set(res.data || []); this.loading.set(false); },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err?.error?.message || 'Erro ao carregar projetos');
      }
    });
  }

  async deleteProject(id: string, name: string) {
    const ok = await this.confirm.ask({
      title: 'Eliminar Projeto',
      message: `Tens a certeza que queres eliminar "${name}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!ok) return;
    this.api.delete(id).subscribe({
      next: () => { this.toast.success('Projeto eliminado'); this.load(); },
      error: err => this.toast.error(err?.error?.message || 'Erro ao eliminar')
    });
  }

  openEditProject(p: Project) {
    this.editId.set(p.id);
    this.editName.set(p.name);
    this.editDescription.set(p.description || '');
    this.editError.set('');
    this.openEdit.set(true);
  }

  submitEdit() {
    const name = this.editName().trim();
    if (!name) {
      this.editError.set('O nome do projeto é obrigatório.');
      return;
    }
    this.editing.set(true);
    this.editError.set('');

    this.api.update(this.editId(), {
      name,
      description: this.editDescription().trim() || undefined,
    }).subscribe({
      next: () => {
        this.editing.set(false);
        this.openEdit.set(false);
        this.toast.success('Projeto atualizado');
        this.load();
      },
      error: (err) => {
        this.editing.set(false);
        this.editError.set(err?.error?.message || 'Erro ao atualizar projeto');
      }
    });
  }

  submitCreate() {
    const name = this.createName().trim();
    if (!name) {
      this.createError.set('O nome do projeto é obrigatório.');
      return;
    }
    this.creating.set(true);
    this.createError.set('');

    this.api.create({
      name,
      description: this.createDescription().trim() || undefined,
    }).subscribe({
      next: () => {
        this.creating.set(false);
        this.openCreate.set(false);
        this.createName.set('');
        this.createDescription.set('');
        this.toast.success('Projeto criado');
        this.load();
      },
      error: (err) => {
        this.creating.set(false);
        this.createError.set(err?.error?.message || 'Erro ao criar projeto');
      }
    });
  }
}
