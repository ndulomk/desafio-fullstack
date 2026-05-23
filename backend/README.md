# Mamboo Kanban — System Design & Backlog

> Documento vivo. Orientado a fluxo, domínio e propriedade de dados. Não é spec técnica, é o cérebro do projecto.

---

## 1. O Que É e Por Que Existe

O Mamboo Kanban é uma ferramenta de gestão operacional de tarefas com estrutura de board Kanban. Utilizadores autenticados podem organizar trabalho em projectos, mover tarefas entre colunas de status, colaborar via comentários e gerir permissões por papel (RBAC).

**Âmbito do desafio:** backend NestJS + frontend Angular, entrega até 28 Mai 2026.

---

## 2. Os Actores

| Actor  | Quem é                        | O que quer                                              |
|--------|-------------------------------|--------------------------------------------------------|
| `user` | Qualquer utilizador registado | Gerir as suas tarefas, ver o board, colaborar          |
| `admin`| Administrador do sistema      | Gerir utilizadores, remover comentários alheios, RBAC  |

Um utilizador tem sempre um papel: `user` ou `admin`. Definido no registo ou promovido por outro admin.

---

## 3. Módulos do Sistema

| Módulo      | Responsabilidade                                          |
|-------------|----------------------------------------------------------|
| **Auth**    | Registo, login, JWT, refresh, protecção de rotas         |
| **Users**   | Perfil, listagem, gestão de papéis (admin)               |
| **Projects**| CRUD de projectos, associação de tarefas                 |
| **Tasks**   | CRUD, status, posição na coluna, movimento entre colunas |
| **Comments**| Comentários por tarefa, remoção pelo autor ou admin      |

---

## 4. Modelo de Dados

### `users`
| Campo         | Tipo        | Notas                             |
|---------------|-------------|-----------------------------------|
| id            | uuid PK     | uuid_generate_v4()                |
| name          | text        | NOT NULL                          |
| email         | text UNIQUE | NOT NULL                          |
| password_hash | text        | argon2 — nunca exposto na API     |
| role          | enum        | `user` \| `admin`                 |
| created_at    | timestamptz |                                   |
| updated_at    | timestamptz |                                   |

### `projects`
| Campo       | Tipo        | Notas                   |
|-------------|-------------|-------------------------|
| id          | uuid PK     |                         |
| name        | text        | NOT NULL                |
| description | text        | nullable                |
| created_by  | uuid FK     | → users(id) RESTRICT    |
| created_at  | timestamptz |                         |
| updated_at  | timestamptz |                         |

### `tasks`
| Campo              | Tipo        | Notas                                         |
|--------------------|-------------|-----------------------------------------------|
| id                 | uuid PK     |                                               |
| title              | text        | NOT NULL                                      |
| description        | text        | nullable                                      |
| status             | enum        | `pending` `in_progress` `testing` `done`      |
| position           | integer     | ordem dentro da coluna — gaps de 1000         |
| project_id         | uuid FK     | → projects(id) CASCADE DELETE                 |
| assigned_to_user_id| uuid FK     | → users(id) SET NULL                          |
| created_by_user_id | uuid FK     | → users(id) RESTRICT                          |
| created_at         | timestamptz |                                               |
| updated_at         | timestamptz |                                               |

**Estratégia de posição:** inteiros com gaps de 1000 (1000, 2000, 3000…). Inserção entre dois items: `Math.floor((posA + posB) / 2)`. Quando o gap fica abaixo de 1, renumera toda a coluna em background. Simples, sem floats, sem lista encadeada.

### `comments`
| Campo      | Tipo        | Notas                          |
|------------|-------------|--------------------------------|
| id         | uuid PK     |                                |
| task_id    | uuid FK     | → tasks(id) CASCADE DELETE     |
| user_id    | uuid FK     | → users(id) RESTRICT           |
| content    | text        | NOT NULL                       |
| created_at | timestamptz |                                |

**Comentários são imutáveis** — sem campo `updated_at`. Só se apagam.

---

## 5. Decisões de Integridade Referencial

| Relação                    | Comportamento em DELETE   | Razão                                         |
|----------------------------|--------------------------|-----------------------------------------------|
| user → projects (criador)  | RESTRICT                 | Projecto não perde contexto de quem o criou   |
| user → tasks (criador)     | RESTRICT                 | Auditoria — saber quem criou é histórico      |
| user → tasks (responsável) | SET NULL                 | Tarefa não morre se o responsável sair        |
| project → tasks            | CASCADE                  | Projecto deletado leva as tarefas             |
| task → comments            | CASCADE                  | Tarefa deletada leva os comentários           |
| user → comments            | RESTRICT                 | Comentário não perde o autor                  |

---

## 6. Jornadas do Utilizador

### 6.1 Registo e Login
```
[1] POST /api/v1/auth/register { name, email, password }
        ↓
[2] Password hashed com argon2 → gravada
[3] Resposta: { accessToken, user: { id, name, email, role } }
        ↓
[4] POST /api/v1/auth/login { email, password }
[5] Verifica hash → assina JWT (7d) → devolve accessToken
        ↓
[6] Todas as rotas privadas: Authorization: Bearer <token>
```

### 6.2 Criar Projecto e Primeiras Tarefas
```
[1] POST /api/v1/projects { name, description? }
        ↓ criado_by = user do token
[2] POST /api/v1/tasks { title, projectId, status: 'pending', ... }
        ↓ position = MAX(position na coluna) + 1000
[3] GET /api/v1/tasks?projectId=X&status=pending
        ↓ lista ordenada por position ASC
[4] PATCH /api/v1/tasks/:id/status { status: 'in_progress' }
        ↓ move para nova coluna → position = MAX(posição nova coluna) + 1000
```

### 6.3 Mover Tarefa Dentro de uma Coluna (reordenar)
```
[1] PATCH /api/v1/tasks/:id/position { afterId?: string, beforeId?: string }
        ↓
[2] Se afterId e beforeId → newPosition = floor((posAfter + posBefore) / 2)
    Se só afterId           → newPosition = posAfter + 1000
    Se só beforeId          → newPosition = floor(posBefore / 2)
        ↓
[3] Se newPosition colidir (gap < 1) → renumera toda a coluna em gaps de 1000
[4] Salva nova position
```

### 6.4 Mover Tarefa Entre Colunas
```
[1] PATCH /api/v1/tasks/:id/move { status: 'testing', afterId?: string }
        ↓
[2] Calcula position no novo status (igual à lógica 6.3)
[3] Actualiza task.status + task.position numa única query
```

### 6.5 Comentários
```
[1] POST /api/v1/tasks/:taskId/comments { content }
        ↓ user_id = token
[2] GET  /api/v1/tasks/:taskId/comments   (paginado, ordem created_at ASC)
[3] DELETE /api/v1/tasks/:taskId/comments/:id
        ↓ guard: só o autor (user_id === token.sub) ou role === 'admin'
```

---

## 7. RBAC — Regras de Autorização

| Acção                          | `user`             | `admin`  |
|--------------------------------|--------------------|----------|
| CRUD dos seus próprios projectos | ✅               | ✅       |
| Ver projectos de outros users  | ❌ (fase 1)        | ✅       |
| CRUD das suas próprias tarefas | ✅                 | ✅       |
| Editar tarefa de outro user    | ❌                 | ✅       |
| Apagar comentário alheio       | ❌                 | ✅       |
| Listar todos os utilizadores   | ❌                 | ✅       |
| Promover user a admin          | ❌                 | ✅       |

Implementado via `@Roles()` decorator + `RolesGuard` + `JwtAuthGuard` encadeados.

---

## 8. API — Endpoints

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login

GET    /api/v1/users              (admin)
GET    /api/v1/users/:id
PATCH  /api/v1/users/:id/role     (admin)

GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/:id
PATCH  /api/v1/projects/:id
DELETE /api/v1/projects/:id

GET    /api/v1/tasks              ?projectId= &status= &page= &limit=
POST   /api/v1/tasks
GET    /api/v1/tasks/:id
PATCH  /api/v1/tasks/:id
DELETE /api/v1/tasks/:id
PATCH  /api/v1/tasks/:id/status   { status }
PATCH  /api/v1/tasks/:id/move     { status, afterId? }
PATCH  /api/v1/tasks/:id/position { afterId?, beforeId? }

GET    /api/v1/tasks/:taskId/comments         ?page= &limit=
POST   /api/v1/tasks/:taskId/comments
DELETE /api/v1/tasks/:taskId/comments/:id
```

---

## 9. Arquitectura de Módulo (estrutura de pastas)

```
src/modules/<domínio>/
  ├── <domínio>.module.ts                     ← NestJS Module (DI, providers)
  ├── events/
  │   └── <singular>.events.ts               ← enum de eventos do domínio
  ├── application/
  │   ├── dtos/     <singular>.dto.ts         ← Create / Update / Response DTOs
  │   ├── ports/    <singular>.port.ts        ← interface abstracta do repositório
  │   └── services/ <singular>.service.ts    ← regras de negócio, orquestração
  └── infrastructure/
      ├── persistence/
      │   └── <singular>.repository.ts       ← implementação Drizzle do port
      └── http/controllers/
          └── <singular>.controller.ts       ← rotas NestJS, só chama o service
```

**Princípio:** o `service` depende do `port` (abstracção). O `repository` implementa o `port`. O NestJS resolve via DI — `{ provide: XxxRepository, useClass: DrizzleXxxRepository }`.

---

## 10. Backlog Priorizado

### P0 — Blocker (entrega mínima funcional)

| # | Item                                                      | Módulo   |
|---|-----------------------------------------------------------|----------|
| 1 | Setup base: NestJS + Drizzle + Postgres + env + migrate   | Infra    |
| 2 | Auth: registo, login, JWT, JwtAuthGuard                   | Auth     |
| 3 | Schema Drizzle: users, projects, tasks, comments          | DB       |
| 4 | CRUD Projects                                             | Projects |
| 5 | CRUD Tasks + filtros por projecto e status + paginação    | Tasks    |
| 6 | Alterar status da tarefa                                  | Tasks    |
| 7 | Mover tarefa entre colunas                                | Tasks    |
| 8 | Posição dentro da coluna (reordenar)                      | Tasks    |
| 9 | CRUD Comentários + guard autor/admin                      | Comments |
|10 | RolesGuard + decorator @Roles()                           | Auth     |
|11 | Swagger com BearerAuth em todas as rotas privadas         | Infra    |
|12 | ValidationPipe global + exception filter global           | Infra    |
|13 | Testes unitários: AuthService, TaskService (status/move)  | Tests    |

### P1 — Importante (diferencial avaliado)

| # | Item                                                      | Módulo   |
|---|-----------------------------------------------------------|----------|
|14 | Testes de integração com banco real (Jest + postgres)     | Tests    |
|15 | Seed de dados (utilizadores + projectos + tarefas)        | Infra    |
|16 | Envelope de resposta padronizado `{ data, meta, error }`  | Shared   |
|17 | Pino logger estruturado com request-id                    | Shared   |
|18 | Atribuir tarefa a um responsável (assignedToUserId)       | Tasks    |
|19 | Filtrar tarefas por projecto no board                     | Tasks    |

### P2 — Diferencial extra

| # | Item                                                          | Módulo |
|---|---------------------------------------------------------------|--------|
|20 | Docker Compose para subir a app + ligar à infra global        | Infra  |
|21 | GitHub Actions CI (lint + test)                               | CI     |
|22 | Testes e2e (supertest) para auth + tasks                      | Tests  |
|23 | Soft delete em tasks e projects (deleted_at)                  | DB     |

---

## 11. Fluxo de Posicionamento — Decisão Técnica

**Problema:** manter ordem das tarefas dentro de uma coluna.

**Decisão:** inteiros com gaps de 1000.

```
Coluna pending: [T1:1000, T2:2000, T3:3000]

Inserir entre T1 e T2:
  newPos = floor((1000 + 2000) / 2) = 1500
  → [T1:1000, T_novo:1500, T2:2000, T3:3000]

Inserir entre T1 e T_novo:
  newPos = floor((1000 + 1500) / 2) = 1250
  → [T1:1000, T_x:1250, T_novo:1500, T2:2000]

Gap < 1 → renumera: multiplica index × 1000
```

**Por que não decimal?** Drizzle/Postgres lidam melhor com integer. Sem drift de float.
**Por que não lista encadeada?** Requer N queries para ler a ordem; integer ordena com `ORDER BY position` sem joins.

---

## 12. O Que NÃO Está no Âmbito

- WebSockets / presença em tempo real
- Notificações push
- Multi-tenancy / workspaces
- Upload de ficheiros / avatares
- OAuth (Google, GitHub)
- Internacionalização
- Dashboard analítico