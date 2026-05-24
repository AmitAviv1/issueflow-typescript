# AI Usage Documentation

## Tool & Models
- **Tool:** Claude Code (Anthropic)
- **Models:** Claude Sonnet 4.6 and Claude Opus 4.7

## How AI Was Used
AI was used in three distinct phases:

1. **Build phase — AI as a tutor.** For the core implementation I wrote the
   code myself. Claude explained every concept before I implemented it,
   answered architectural questions, and helped diagnose errors. Each feature
   was understood before being written.
2. **Review & remediation phase — AI as a reviewer/implementer.** After the
   first version was working, I asked Claude to review the whole codebase
   against the requirements PDF. It produced a gap analysis, and I then had it
   implement the fixes. I reviewed every change, and the project ships with
   `CLAUDE.md` documenting the codebase so I can account for all of it.
3. **API testing & error-message polish phase — AI as a quality reviewer.**
   After exercising the endpoints with Postman, I asked Claude to audit every
   service for cases where the API returned a generic 500 or silently
   succeeded, and to replace them with informative HTTP errors.

---

## Phase 1 — Build (design discussions during implementation)

### Architecture & Design
- "Walk me through the layering trade-offs of NestJS modules, controllers,
  and services, and where business logic should live."
- "Compare a feature-folder layout against a layer-based layout for a
  domain of this size — which scales better as more modules are added?"
- "Discuss the REST resource model for this domain: which collections are
  top-level, which should be nested under tickets, and why."

### TypeORM & Database
- "Compare TypeORM's `find` API with `createQueryBuilder` for queries
  involving many-to-many junctions and aggregates — when is each
  appropriate?"
- "Discuss the trade-offs between `eager` relations and explicit
  `relations` arrays in service queries."
- "How should the soft-delete pattern (`deletedAt IS NULL`) be enforced
  across reads, and where is it acceptable to bypass it?"

### Security & Authentication
- "Discuss the design of the JWT auth layer: strategy vs. guard, how the
  payload should be shaped, and how to invalidate tokens on logout
  without a session store."
- "Why is `select: false` on the password column important, and how does
  it interact with the login query?"
- "Compare a per-route guard model with a global guard plus opt-out
  decorator — what does each cost in code and risk?"

### Domain features
- "Design the auto-assignment algorithm: how should ties be broken, which
  tickets count toward load, and what audit signal should it emit?"
- "Discuss attachment storage: local disk vs. object storage, what
  metadata to persist, and how to enforce content-type and size limits."
- "Walk through the trade-offs of soft delete vs. hard delete for
  tickets and projects, and how restore should be gated."

---

## Phase 2 — Review & Remediation (prompts from the review session)

- "Review the codebase end-to-end and flag any deviations from NestJS and
  REST best practices."
- "Introduce DTOs for every request body and wire up a global
  `ValidationPipe`; explain the trade-off between `Partial<Entity>` and
  an explicit DTO at the controller boundary."
- "Audit the implementation against `Instructions.md` and the
  requirements PDF and produce a gap analysis."
- "Implement the spec-compliance fixes from the gap analysis."
- "Add a `CLAUDE.md` documenting the codebase conventions."
- "Update `prompts.md` to reflect the remediation."

### What the remediation changed
- Added DTOs (`class-validator`) for every request body + global `ValidationPipe`.
- Made JWT auth global (`APP_GUARD`) with a `@Public()` opt-out decorator.
- Added a `RolesGuard` + `@Roles('ADMIN')` for ADMIN-only soft-delete endpoints.
- Implemented real logout via a token deny-list.
- Enforced the ticket status lifecycle, DONE-immutability, and the
  "no DONE with unresolved blockers" rule.
- Added optimistic locking (`@VersionColumn`) to Ticket and Comment.
- Added the `isOverdue` flag and corrected the auto-escalation job.
- Fixed auto-assignment (count non-DONE only, `AUTO_ASSIGN` audit entry).
- Made the workload endpoint list all developers, sorted ascending.
- Made @mention matching case-insensitive; comments sorted newest-first.
- Added file-size/type limits to attachment uploads.
- Added `NotFoundException` (404) handling across all services.
- Added audit logging for User CRUD.
- Moved DB + JWT config into a `.env` file via `@nestjs/config`.
- Wired the authenticated user (`@CurrentUser()`) into audit-log `performedBy`.

---

## Phase 3 — API testing & error-message polish

After the remediation phase I exercised the full API surface via Postman to
verify behavior end-to-end. The session focused on two outcomes:

1. Confirming that the auth model (global JWT with a `@Public()`
   registration endpoint, REST-style `PATCH /users/:id` for updates) was
   correctly understood and documented.
2. Auditing every service for cases where the API returned a generic 500
   or silently "succeeded" on invalid input, and replacing them with
   informative HTTP errors that name the missing entity and the actual
   problem.

### Representative prompts
- "Audit every controller and service. Where can the API currently return
  a 500 or succeed silently? Replace those paths with informative
  `NotFoundException` / `BadRequestException` / `ConflictException`
  responses that name the missing entity."
- "Signup should not 500 on a duplicate email or username — return a
  `ConflictException` with a clear message."
- "Signup should accept an optional password and default to `'secret'`
  when none is provided; in both cases the value must be hashed with
  bcrypt before persisting."
- "Generate a Postman-ready endpoint reference for the full API surface,
  including which routes are public and which require a Bearer token."

### What the error-message audit changed
- `POST /users` returns `409 Conflict` with a clear message on duplicate
  username or email instead of a generic 500.
- `POST /users` accepts an optional `password` (defaults to `"secret"`)
  and always hashes the value with bcrypt before persisting.
- `POST /tickets` validates the referenced assignee and project up front,
  returning `404 Assignee user X not found` or `400 Project X not found`
  instead of a foreign-key 500.
- `DELETE /tickets/:id` and `POST /tickets/:id/restore` (and the
  equivalent project endpoints) now distinguish "not found" (`404`) from
  "already in that state" (`400`).
- `POST /tickets/:id/comments` validates the ticket and author and
  returns `404` with the missing id.
- `POST /tickets/:id/attachments` validates the ticket; `DELETE` on a
  missing attachment now returns `404` instead of succeeding silently.
- `POST /tickets/:id/dependencies` returns `409` on a duplicate
  dependency; `DELETE` returns `404` when no such dependency exists.
- `POST /projects` validates that the owner user exists.
- `POST /auth/set-password` validates that the target user exists.
- Existing unit-test mocks were updated to match the new behavior; all 24
  tests pass.

---

## What I Did Myself
- Wrote all core CRUD code across the modules during the build phase.
- Made structural and naming decisions.
- Ran and manually tested API endpoints.
- Reviewed and verified every AI-applied remediation change.
- Studied `CLAUDE.md` so I understand and can account for the full codebase,
  including the AI-assisted fixes.

## What AI Helped With
- Explaining NestJS, TypeORM, and TypeScript concepts during the build.
- Reviewing the codebase against the requirements and producing a gap analysis.
- Implementing the spec-compliance fixes listed above.
- Writing and updating unit tests.
- Producing the project documentation (`CLAUDE.md`).
