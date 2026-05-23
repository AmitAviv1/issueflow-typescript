# AI Usage Documentation

## Tool & Models
- **Tool:** Claude Code (Anthropic)
- **Models:** Claude Sonnet 4.6 (initial build and review) and Claude Opus 4.7
  (later spec-gap remediation)

## How AI Was Used
AI was used in two distinct phases:

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
