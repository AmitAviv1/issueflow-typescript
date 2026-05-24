# AI Usage Documentation

## Tool & Models
- **Tool:** Claude Code (Anthropic)
- **Models:** Claude Sonnet 4.6 (initial build and review) and Claude Opus 4.7
  (later spec-gap remediation)

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
   `INTERVIEW_PREP.md` and `CLAUDE.md` documenting the codebase so I can
   account for all of it.
3. **API testing & error-message polish phase — AI as a quality reviewer.**
   After exercising the endpoints with Postman, I asked Claude to audit every
   service for cases where the API returned a generic 500 or silently
   succeeded, and to replace them with informative HTTP errors.

---

## Phase 1 — Build (questions I asked while writing the code)

### Architecture & Design
- "What is the purpose of a Module, Controller, and Service in NestJS, and why is this separation important?"
- "Why should I organize code into feature folders rather than keeping everything flat?"
- "What is the reasoning behind REST API design and why does each resource get its own URL?"

### TypeORM & Database
- "What is an ORM and how does TypeORM compare to writing raw SQL?"
- "What is the purpose of entity relationships and how do ManyToOne and ManyToMany differ?"
- "What does the `relations` option do when querying and why is it necessary?"
- "When should I use `createQueryBuilder` instead of the standard `find()` method?"
- "What is the difference between `forRoot` and `forFeature` in TypeOrmModule?"

### TypeScript Concepts
- "What is a Promise and why is async/await necessary when working with databases?"
- "What is `Partial<T>` and when should it be used over the full type?"

### Security & Authentication
- "How does bcrypt hashing work and where is the hashed password stored?"
- "What is the role of JWT in authentication and how does it solve the stateless HTTP problem?"
- "What is the difference between the JWT Strategy and the JWT Guard?"

### Features
- "What does the Workload API return and how is it used by auto-assignment?"
- "Why should file attachments be stored on disk rather than directly in the database?"
- "How does soft delete differ from hard delete and why is it preferred?"

---

## Phase 2 — Review & Remediation (prompts from the review session)

- "Can you review the code and tell me if I did it the best way?"
- "Now I want an explanation of the whole project — the things they are likely
  to ask about in the interview, and more." → produced `INTERVIEW_PREP.md`.
- "Do I have DTOs?" → discovered none existed.
- "If I add DTOs, will it cause a lot of changes?"
- "Add DTOs and explain `Partial<Entity>` vs DTO in the prep doc."
- "Do you think the project is finished, based on Instructions.md and the
  requirements PDF?" → produced a full requirements gap analysis.
- "Fix it." → applied the spec-compliance fixes (see below).
- "Do both remaining items, fix INTERVIEW_PREP.md, and add a CLAUDE.md."
- "Update the prompts.md."

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
- Studied `INTERVIEW_PREP.md` and `CLAUDE.md` so I understand and can account
  for the full codebase, including the AI-assisted fixes.

## What AI Helped With
- Explaining NestJS, TypeORM, and TypeScript concepts during the build.
- Reviewing the codebase against the requirements and producing a gap analysis.
- Implementing the spec-compliance fixes listed above.
- Writing and updating unit tests.
- Producing the project documentation (`INTERVIEW_PREP.md`, `CLAUDE.md`).
