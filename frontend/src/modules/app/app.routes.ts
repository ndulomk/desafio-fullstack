import { Routes } from '@angular/router';
import { authGuard } from '../auth/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('../../components/layout/auth-layout').then(m => m.AuthLayoutComponent),
    children: [
      { path: 'login', loadComponent: () => import('../auth/pages/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('../auth/pages/register.component').then(m => m.RegisterComponent) },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('../../components/layout/bottom-nav').then(m => m.BottomNavComponent),
    children: [
      { path: 'projects', loadComponent: () => import('../projects/projects.component').then(m => m.ProjectsComponent) },
      { path: 'kanban', loadComponent: () => import('../task/kanban.component').then(m => m.KanbanComponent) },
      { path: 'tasks/:id', loadComponent: () => import('../task/task-detail.component').then(m => m.TaskDetailComponent) },
      { path: '', redirectTo: 'projects', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '/auth/login' },
];
