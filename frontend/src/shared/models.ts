// ── Auth ──────────────────────────────────────────────────────────────────────
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface RefreshDto {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken?: string; // só se não vier em cookie
  refreshToken: string;
  user: User;
}

// ── User ──────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: string;
}

export interface UpdateProfileDto {
  name?: string;
}

export interface UpdateRoleDto {
  role: 'user' | 'admin';
}

export interface UserListParams {
  role?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

// ── Project ───────────────────────────────────────────────────────────────────
export interface Project {
  id: string;
  name: string;
  description: string | null;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
}

export interface ProjectListParams {
  page?: number;
  limit?: number;
}

export interface Pagination {
  currentPage: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}

export interface ListResponse<T> {
  data: T[];
  pagination: Pagination;
}

// ── Task ──────────────────────────────────────────────────────────────────────
export type TaskStatus = 'pending' | 'in_progress' | 'testing' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  position: number;
  project: { id: string; name: string };
  assignedTo: User | null;
  createdBy: User;
  updatedBy: User | null;
  createdAt: string;
  updatedAt: string;
}

export type TaskList = ListResponse<Task>;

export interface CreateTaskDto {
  title: string;
  description?: string;
  projectId: string;
  status?: TaskStatus;
  assignedToUserId?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  assignedToUserId?: string | null;
}

export interface TaskListParams {
  projectId?: string;
  status?: TaskStatus;
  assignedToUserId?: string;
  page?: number;
  limit?: number;
}

export interface MoveTaskDto {
  status: TaskStatus;
  afterId?: string;
}

export interface ReorderTaskDto {
  afterId?: string;
  beforeId?: string;
}

// ── Comment ───────────────────────────────────────────────────────────────────
export interface Comment {
  id: string;
  taskId: string;
  user: User;
  content: string;
  createdAt: string;
}

export type CommentList = ListResponse<Comment>;

export interface CreateCommentDto {
  content: string;
}

export interface CommentListParams {
  page?: number;
  limit?: number;
}