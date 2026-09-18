# 0001. Adopt Better Auth for authentication — rationale

## Context

> ⚠️ Premise note: this spec hand rolls the NestJS wiring (mounting Better Auth's request handler, a guard that reads the session, a param decorator), not the security sensitive parts (password hashing, token generation, session storage, CSRF, rate limiting). Those stay inside Better Auth. Writing custom glue code around a proven auth library is a different risk than writing custom auth from scratch, and is the same shape of call this project already made for Arcjet (`@arcjet/node` plus a hand written guard, instead of the version incompatible `@arcjet/nest`).
>
> Second, replacing the existing `User` table's `Int` id with Better Auth's string id is a breaking schema change. Any rows already in the local `User` table are lost when the new migration runs. Flagged here and in Consequences; acceptable for a learning project with no production data, but call it out before running the migration on any database that matters.

This project has no authentication today. Requests to `/users` are unauthenticated, and anyone can create, list, or read any user record. Adding real users, sessions, and access control is a prerequisite for the app to mean anything beyond a demo.

The project already runs NestJS 12 (Express under `@nestjs/platform-express`), Prisma 7 against Postgres, and Arcjet for request level protection (rate limiting, bot detection, a WAF). The existing `Users` module (`src/users/`) predates auth: its Prisma `User` model uses an integer, autoincrementing id, which does not match the string ids Better Auth's own `User` model expects.

The official Better Auth NestJS integration guide documents a community package, `nestjs-better-auth`, that provides a global guard and decorators (`@Session()`, `@AllowAnonymous()`, `@OptionalAuth()`). Checked against the npm registry, its latest published version (0.6.4) declares peer dependencies of `@nestjs/core@^11.1.6` and `@nestjs/common@^11.1.6`, capped below this project's NestJS 12. This is the same situation already documented in this project's README for `@arcjet/nest` (also capped below NestJS 12), which is why Arcjet is integrated through the plain `@arcjet/node` SDK and a small hand written guard instead. `better-auth` itself (checked at 1.7.5) is framework agnostic and has no such conflict; only the NestJS specific wrapper does.

There is no compliance scope beyond ordinary account data (email, name); no payments, health, or otherwise regulated data is involved.

## Options considered

### Option 1: Better Auth, hand rolled NestJS integration

Use `better-auth` directly: mount its request handler at `/api/auth/*` with `main.ts`'s body parser disabled for that path, and write a small custom guard, admin check, and param decorator (a few dozen lines), the same shape as the existing `ArcjetGuard`.

**Pros**:
- No dependency on a package whose declared peer range does not cover this project's NestJS version.
- Full control over how guards apply (matches the project's existing per route `@UseGuards` convention).
- The extra code is small and auditable, not a black box.

**Cons**:
- No `@Session()`/`@AllowAnonymous()` decorators out of the box; this project writes and maintains its own, thin as they are.

### Option 2: Better Auth via the `nestjs-better-auth` wrapper package

Install `nestjs-better-auth`, forcing past its peer dependency check (`npm install --force` or a `package.json` override), and use its `AuthModule.forRoot`, global `AuthGuard`, and decorators as documented.

**Pros**:
- Less code to write: a global guard and ready made decorators.
- Matches the integration guide's documented path exactly.

**Cons**:
- Its peer range does not include NestJS 12; forcing the install accepts an unverified combination, on a community maintained, non official package. This project already chose not to take this exact risk once, for Arcjet.
- A future `npm install` without the force flag, or a teammate's clean clone, can silently fail or warn confusingly until the override is understood.

### Option 3: Roll authentication by hand (no library)

Write password hashing, session tokens, and cookie or bearer handling directly against Prisma, with no auth library.

**Pros**:
- Zero new dependency; complete control over every detail.

**Cons**:
- Password hashing, session fixation, timing attacks on login, and CSRF are each a real way to get this wrong, and this project has no track record here. This is the exact "reinventing auth" failure pattern: hard to get right, and the payoff for doing it by hand is small compared to a maintained library.

## Rationale

The choice comes down to the same fact that already shaped this project's Arcjet integration: the ready made NestJS wrapper's peer dependency range does not reach NestJS 12. Forcing an unsupported peer combination for the sake of a few decorators is not a trade this project has been willing to make before, and there is no new reason to make it now. The hand rolled glue code is small (a guard, an admin check, a decorator) precisely because Better Auth itself does the hard, security sensitive parts (hashing, tokens, rate limiting, CSRF); none of that is being reimplemented, only the NestJS specific wiring around it. Rolling authentication entirely by hand (Option 3) was rejected outright: the parts a library gets right through years of scrutiny are exactly the parts most costly to get subtly wrong.
