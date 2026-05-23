# CLAUDE.md

Guidance for AI agents (and developers) working in this repository.

> **Project:** IssueFlow — Ticket Management Backend Platform
> **Assignment:** AT&T TDP 2026 Home Assignment
> **AI model used:** claude-sonnet-4-6

---

## 1. What this project is

IssueFlow is a **RESTful backend API** for a lightweight project and issue
tracking platform (think a small Jira). It is backend-only — there is no
frontend. All behaviour is exercised over HTTP.

It manages: **Users, Projects, Tickets, Comments, Audit Logs, Ticket
Dependencies, and Attachments**, plus JWT auth, soft delete, CSV import/export,
@mentions, auto-escalation, and auto-assignment.

The authoritative API contract is the table in `README.md`.

---

## 2. Tech stack

| Concern | Choice |
|---|---|
| Language | TypeScript 5.x |
| Framework | NestJS 10 |
| Database | PostgreSQL (via Docker, `compose.yml`) |
| ORM | TypeORM 0.3 |
| Auth | JWT (`@nestjs/jwt` + `@nestjs/passport`), bcrypt |
| Validation | `class-validator` + `ValidationPipe` |
| Config | `@nestjs/config` (`.env`) |
| Scheduling | `@nestjs/schedule` (cron) |
| File upload | Multer |
| CSV | `csv-parse` / `csv-stringify` |
| Tests | Jest |

---

## 3. Commands

```bash
# Install dependencies
npm install

# Start the PostgreSQL database (Docker required)
docker compose up -d

# Run the app in watch mode (http://localhost:3000)
npm run start:dev

# Build
npm run build

# Unit tests
npm run test

# E2E tests (requires the database running)
npm run test:e2e

# Lint
npm run lint
```

See `run.md` for full setup steps.

---

## 4. Configuration

All configuration is read from a `.env` file at the project root via
`@nestjs/config`. A committed `.env.example` documents the required keys:

```
DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME
JWT_SECRET, JWT_EXPIRES_IN
```

`.env` is git-ignored. The code provides sensible fallback defaults (matching
`compose.yml`), so the app still runs if `.env` is missing.

`synchronize: true` is enabled on TypeORM — the schema auto-syncs from the
entities on startup. This is fine for this assignment; production would use
migrations instead.

---

## 5. Architecture & conventions

### The per-feature pattern

Every domain feature is a self-contained folder under `src/` and follows the
same layered structure:

```
src/<feature>/
  <feature>.entity.ts        TypeORM entity = DB table
  dto/create-<feature>.dto.ts  validated shape for POST bodies
  dto/update-<feature>.dto.ts  validated shape for PATCH bodies (all optional)
  <feature>s.service.ts      business logic + DB access
  <feature>s.controller.ts   HTTP layer
  <feature>s.module.ts       wires entity + service + controller
```

Layer responsibilities — **do not blur these**:
- **Controller** — HTTP only: read params/body/user, call the service, return.
  Never touches the repository directly.
- **Service** — all business logic and all DB access (via the injected
  repository). All domain rules live here.
- **Entity** — table shape only. No logic.
- **DTO** — request shape + validation decorators only.

### Modules present

`user, project, ticket, comment, audit-log, dependency, attachment, auth,
scheduler`. All are imported by `src/app.module.ts`.

### Auth (important)

- `JwtAuthGuard` and `RolesGuard` are registered **globally** as `APP_GUARD` in
  `app.module.ts`. Every route is JWT-protected by default.
- To make a route public, add `@Public()` (`src/auth/public.decorator.ts`).
  Currently public: `POST /auth/login`, `POST /auth/set-password`, `GET /`.
- To restrict by role, add `@Roles('ADMIN')` (`src/auth/roles.decorator.ts`).
- To get the logged-in user inside a controller, use the `@CurrentUser()`
  param decorator (`src/auth/current-user.decorator.ts`). Pass `user.id` into
  services as the `performedBy` argument so the audit log records the actor.

### Audit logging

Every state-changing service method calls `AuditLogService.log(...)`. When
adding a new mutating action, add an audit log call. System-triggered actions
use `performedBy = 0` and `actor = 'SYSTEM'`.

---

## 6. Domain rules (must be preserved)

These are spec requirements — any change must keep them true:

- **Ticket status lifecycle:** `TODO → IN_PROGRESS → IN_REVIEW → DONE`. Forward
  only; backward transitions are rejected (`400`).
- **A DONE ticket cannot be updated** at all (`400`).
- **A ticket cannot move to DONE** while it has a blocking dependency that is
  not yet DONE (`400`).
- **Optimistic locking:** `Ticket` and `Comment` have a `@VersionColumn`.
  Updates load-then-`save()`; concurrent edits raise `409 Conflict`.
- **Soft delete:** tickets and projects are never hard-deleted — `deletedAt` is
  set. Normal queries filter `deletedAt IS NULL`. Listing/restoring soft-deleted
  records is **ADMIN only**.
- **Enums:** role `ADMIN|DEVELOPER`; status `TODO|IN_PROGRESS|IN_REVIEW|DONE`;
  priority `LOW|MEDIUM|HIGH|CRITICAL`; type `BUG|FEATURE|TECHNICAL`.
- **Auto-assignment:** a ticket created with no `assigneeId` goes to the
  DEVELOPER with the fewest non-DONE tickets in that project (ties: lowest user
  id). Logged as `AUTO_ASSIGN` / `SYSTEM`.
- **Auto-escalation:** a cron job promotes overdue, non-DONE, non-CRITICAL
  tickets one priority level; sets `isOverdue = true` at CRITICAL. A manual
  priority change clears `isOverdue`.
- **@mentions:** `@username` in a comment is parsed (case-insensitive),
  resolved to users, and stored; re-evaluated on update.
- **Attachments:** max 10MB; only `image/png`, `image/jpeg`, `application/pdf`,
  `text/plain`.

---

## 7. Conventions for changes

- Add new request fields via a **DTO with validators** — never widen a body to
  `Partial<Entity>` or `any`.
- New endpoints are JWT-protected automatically; only add `@Public()` when
  truly necessary.
- Throw NestJS HTTP exceptions (`NotFoundException`, `BadRequestException`,
  `ConflictException`, `ForbiddenException`) — do not return `null` for
  "not found".
- Keep business rules in services, not controllers.
- After any change, run `npm run build` and `npm run test` before finishing.
- Update the unit tests when a service constructor or behaviour changes.

---

## 8. Testing

- Unit tests live next to the code as `*.spec.ts` and mock the TypeORM
  repositories (no real database).
- E2E tests live in `test/` and boot the full app (need the database running).
- Run `npm run test` for unit, `npm run test:e2e` for E2E.

---

## 9. Known limitations / not done

- `synchronize: true` instead of migrations (acceptable for the assignment).
- Logout deny-list is in-memory — cleared on restart, not shared across
  instances (Redis would fix this in production).
- No circular-dependency detection on ticket dependencies.
- Attachments are stored on local disk (`./uploads`), not cloud storage.

---

*This file documents the project for AI agents per assignment requirement 4.5.
Model used to build the solution: claude-sonnet-4-6.*
