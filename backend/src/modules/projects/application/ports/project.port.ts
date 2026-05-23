import type { UpdateProjectDto, ProjectResponseDto } from '../dtos/project.dto';
import type { DbOrTx } from 'src/db/transaction';

export interface IProjectsRepository {
  create(
    data: { name: string; description?: string; createdBy: string },
    db?: DbOrTx,
  ): Promise<ProjectResponseDto>;

  findById(id: string): Promise<ProjectResponseDto | null>;

  findAll(filters?: {
    page?: number;
    limit?: number;
    offset?: number;
  }): Promise<{ data: ProjectResponseDto[]; total: number }>;

  update(
    id: string,
    data: Partial<UpdateProjectDto>,
    db?: DbOrTx,
  ): Promise<ProjectResponseDto>;

  delete(id: string, db?: DbOrTx): Promise<void>;
}

export const PROJECTS_REPOSITORY = Symbol('IProjectsRepository');
