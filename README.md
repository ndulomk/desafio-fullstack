# Mamboo Kanban

Kanban operacional para gestão de projetos e tarefas. Permite criar projetos, organizar tarefas em colunas (Pendente, Em Progresso, Teste, Concluído), atribuir responsáveis, comentar e acompanhar o estado de cada item.

---

## Tecnologias Utilizadas

### Backend
- **NestJS** v11 — framework Node.js modular
- **Drizzle ORM** — ORM SQL-like leve e type-safe
- **PostgreSQL** — base de dados relacional
- **Zod** — validação de schemas e DTOs
- **@node-rs/argon2** — hashing de passwords
- **jsonwebtoken** — tokens JWT em cookies httpOnly
- **Pino** — logger estruturado

### Frontend
- **Angular** v21 — framework SPA com signals
- **Tailwind CSS** v4 — utilitário de estilos
- **@angular/cdk** — drag-and-drop do Kanban

### Infraestrutura
- **Docker Compose** — PostgreSQL + backend + frontend
- **SWC** — transpilação rápida do NestJS

---

## Decisões de Arquitetura

O projeto segue uma abordagem inspirada em **Clean Architecture** e **Ports & Adapters** (Arquitetura Hexagonal), com separação clara entre o core de negócio e as tecnologias externas.

### Backend — estrutura por módulos

```
modules/{dominio}/
├── application/
│   ├── dtos/          — contratos de entrada/saída (Zod schemas + Swagger DTOs)
│   ├── ports/         — interfaces dos repositórios (contratos que a infraestrutura implementa)
│   └── services/      — regras de negócio, casos de uso
├── infrastructure/
│   ├── http/controllers/  — contacto com o framework NestJS (rotas, decorators)
│   └── persistence/       — implementação dos repositories com Drizzle ORM
```

**Porquê esta estrutura?**
- A `application` contém o que não muda se trocarmos de framework ou de base de dados.
- Os `ports` (interfaces) garantem que podemos trocar o PostgreSQL por outro motor sem tocar na lógica de negócio.
- O `db-exec` envolve todas as operações da base de dados num try/catch com logs estruturados — a base de dados é um serviço externo e deve ser tratada como tal.
- O `DbOrTx` permite reutilizar transações em múltiplos repositories sem refatoração.
- Cada repository tem um **mapper** (`toDto`) para traduzir os dados do ORM num contrato estável. Isto evita que tipos internos do Drizzle vazem para a aplicação.
- A paginação é unificada num helper partilhado (`ListResponse<T>`) para que todos os endpoints de listagem retornem o mesmo formato.

### Encriptação de PII
Decidi encriptar campos que identificam pessoas (`name`, `email`) antes de persistir na base de dados. Embora seja overkill para um MVP, é um hábito de segurança que previne exposição de dados em caso de vazamento da base de dados. O `emailHash` é guardado em plain text para permitir lookups rápidos por email no login.

### Autenticação
Utilizei **server-side cookies** (`httpOnly`, `Secure`, `SameSite=strict`) em vez de Bearer tokens no `Authorization` header. Cookies são mais seguros contra XSS e o browser gerencia o envio automaticamente (com `withCredentials: true` no frontend).

### Frontend
- Standalone components com Signals para reatividade granular.
- Tailwind v4 com dark mode via classe `.dark` no `<html>`, sincronizado com `localStorage`.
- Formulários sem `ngModel` (que tem problemas com signals em blocos `@if` no Angular 17+), usando `[value]` + `(input)` diretamente em signals.

---

## Instruções de Execução

### Subir tudo com Docker Compose (recomendado)

```bash
docker compose up -d
```

Isto sobe:
- PostgreSQL (interno, acessível pelo backend)
- Backend na porta `3000`
- Frontend na porta `8080`

Depois de subir, correr migrations e seed:

```bash
# Migrations
docker compose exec backend npx tsx src/db/migrate.ts

# Seed (cria admin + user de teste)
docker compose exec backend npx tsx src/db/seed.ts
```

A aplicação estará disponível em:
- Frontend: http://localhost:8080
- Backend: http://localhost:3000/api/v1
- Swagger: http://localhost:3000/docs

---

## Testes

### Backend

```bash
cd backend

# Todos os testes (unitários + integração)
npm run test

# Apenas unitários
npm run test:unit

# Apenas integração (requer PostgreSQL a correr)
npm run test:integration
```

Os testes de integração usam uma base de dados separada (`mamboo_test`), truncam as tabelas entre testes e correm sequencialmente (`--runInBand`) para evitar conflitos de dados.

### Frontend

```bash
cd frontend
ng test
```

---

## Variáveis de Ambiente

Vide `backend/.env.example`:

| Variável | Descrição |
|---|---|
| `NODE_ENV` | `development` ou `production` |
| `PORT` | Porta do servidor (default: 3000) |
| `DB_HOST` | Host da base de dados |
| `DB_PORT` | Porta da base de dados |
| `DB_USER` | Utilizador PostgreSQL |
| `DB_PASSWORD` | Password PostgreSQL |
| `DB_NAME` | Nome da base de dados |
| `DB_SSL` | `true` ou `false` |
| `JWT_SECRET` | Segredo para assinar tokens |
| `JWT_EXPIRES_IN` | Tempo de vida do token (ex: `7d`) |
| `ENCRYPTION_KEY` | Chave de 32 bytes para AES-256-GCM |

---

## Usuários de Teste (Seed)

Correr `npm run db:seed` no backend cria:

| Email | Password | Role |
|---|---|---|
| `admin@mamboo.local` | `admin123` | `admin` |
| `user@mamboo.local` | `user123` | `user` |

---

## Documentação da API

Swagger UI: http://localhost:3000/docs

Endpoints principais:
- `POST /api/v1/auth/register` — registo
- `POST /api/v1/auth/login` — login (cookie)
- `POST /api/v1/auth/logout` — logout
- `GET /api/v1/auth/me` — perfil do utilizador autenticado
- `GET /api/v1/projects` — listar projetos
- `POST /api/v1/projects` — criar projeto
- `GET /api/v1/tasks` — listar tarefas
- `POST /api/v1/tasks` — criar tarefa
- `PATCH /api/v1/tasks/:id/status` — mudar status
- `GET /api/v1/tasks/:id` — detalhes da tarefa

---

## Funcionalidades Implementadas

- [x] Autenticação (registo, login, refresh, logout) com cookies httpOnly
- [x] Autenticação (registo, login, refresh, logout) com cookies httpOnly
- [x] CRUD de projetos (incl. editar no frontend)
- [x] CRUD de tarefas com status (pending → in_progress → testing → done)
- [x] Kanban drag-and-drop entre colunas
- [x] Mover tarefa entre projetos
- [x] Ordenar tarefas dentro da coluna
- [x] Atribuição de tarefas a utilizadores
- [x] Comentários em tarefas (criar, listar, eliminar — autor/admin)
- [x] Dark mode persistente
- [x] Confirmação antes de eliminar
- [x] Validação de DTOs com Zod
- [x] Testes unitários e de integração
- [x] Documentação Swagger
- [x] Docker Compose completo (backend + frontend + PostgreSQL)
- [x] Rate limit
- [x] CI GitHub Actions (lint, typecheck, unit, integration)ing

---

## Pontos Pendentes

- [ ] Frontend: testes unitários e e2e
- [ ] Upload de ficheiros anexos às tarefas
- [ ] Notificações em tempo real (WebSockets)
- [ ] Filtros avançados no Kanban (por assignee, data, etc.)
- [ ] Atualização de perfil de utilizador
- [ ] Gestão de utilizadores (admin panel completo)
- [ ] CI/CD pipeline completa (frontend + deploy)

---

## Uso de IA no Desenvolvimento

### Ferramentas utilizadas
- **OpenCode (Kimi k2.5 / DeepSeek)** — agente de coding no ambiente local
- **Claude** — brainstorming de arquitetura e system design

### Em que ajudaram
A IA foi utilizada principalmente como acelerador de produtividade em tarefas mecânicas, não como substituta de decisão arquitetural:
- **System design inicial** — estrutura de módulos, fluxos de autenticação, contratos de API.
- **Backlog orientado a fluxo** — mapeamento das jornadas do utilizador no sistema.
- **Boilerplate** — geração de controllers, DTOs e componentes base.
- **Debug** — diagnóstico de erros de TypeScript, ESLint e runtime.
- **Pesquisa** — sintaxe específica do Angular 17+ (signals, standalone, novo sistema de formulários).

### Decisões tomadas por mim
Toda a arquitetura, padrões de código, estrutura de pastas, escolha de Drizzle ORM, uso de server-side cookies em vez de Bearer tokens, o middleware de rate limit in-memory, a ideia de encriptar PII, e a estrutura de testes (testar o negócio primeiro) foram decisões próprias. A IA é um martelo — o que se constrói com ele é responsabilidade do arquiteto.

### Trechos gerados por IA que foram revisados ou corrigidos
- **DTOs e controllers** — frequentemente geravam imports errados ou usavam `@UsePipes` em vez de `@Body(new ZodValidationPipe(...))`, o que quebrava a validação quando havia múltiplos argumentos (ex: `@Body` + `@CurrentUser`).
- **Frontend forms** — o Angular 17+ com signals e `@if` blocks tem comportamentos específicos com `ngModel` que a IA não antecipou. Converti manualmente todos os forms para signals puros (`[value]` + `(input)`).
- **SWC / decorators** — a IA sugeriu configurações de SWC que não emitiam `decoratorMetadata`. Tive de corrigir manualmente o `.swcrc` e `nest-cli.json`.
- **Paginação** — a IA propôs formatos inconsistentes entre módulos. Unifiquei manualmente num `ListResponse<T>` partilhado.
- **Testes de integração** — rodavam em paralelo por default, causando deadlocks na base de dados. Configurei manualmente para correr sequencialmente (`--runInBand`).

### Limitações, problemas e riscos identificados
- **Rate limit in-memory** — funciona apenas numa instância. Para múltiplas réplicas, seria necessário um store distribuído (Redis, etc.).
- **Hard delete** — optei por CASCADE em vez de soft delete para simplificar. Num sistema real, soft delete seria preferível para auditoria.
- **CI só no backend** — o frontend ainda não tem lint/testes no pipeline. O CI atual cobre apenas o backend.
- **Encriptação de PII** — adiciona overhead de CPU e complexidade. Para um MVP, poderia ser desnecessário, mas mantive como prática de segurança.
- **Testes de integração** — partilham a mesma base de dados. Em CI, seria ideal usar test containers isolados por suite.
- **Angular standalone** — ainda há comportamentos edge-case com signals e blocos `@if` que não estão totalmente documentados.

---

## Principais Trade-offs Técnicos

1. **Clean Architecture vs velocidade** — A separação stricta entre `application` e `infrastructure` adiciona boilerplate. O trade-off aceitável porque facilita testes e troca de tecnologias.
2. **Zod vs class-validator** — Zod é mais verboso mas dá schemas reutilizáveis no frontend. NestJS prefere class-validator, mas optei por consistência entre backend e frontend.
3. **Cookies vs Bearer tokens** — Cookies são mais seguros contra XSS mas menos flexíveis para clientes não-web. Como o projeto é uma web app, a escolha foi fácil.
4. **Drizzle vs Prisma** — Drizzle é mais leve e SQL-like, mas com menos abstração. Preferi o controlo explícito sobre o ORM.
5. **SWC vs TSC** — SWC é mais rápido mas perdeu `decoratorMetadata` na configuração inicial. O ganho de velocidade justifica a configuração extra.

---

## Licença

MIT
