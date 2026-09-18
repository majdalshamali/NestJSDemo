# Scope

**Workflow:** Alpha (default; no tier declared for this project yet. Alpha means a `Verify it` step runs after build, but not `Test it`/`Review it`/`Document it`. Adjust with `/scope` if this project wants a different default, e.g. `Beta` once auth code should also get a written test suite.)

## At a glance

| Feature | Status |
|---|---|
| Authentication (Better Auth) | in-progress |

## Authentication (Better Auth)

**Intent**: Add sign up, sign in, and session handling so `/users` and future routes require a known, authenticated caller, with a basic user/admin role split.

**Done when**: A visitor can sign up and sign in with email and password, receives a bearer token, can view their own user record, and only an admin can list all users or view someone else's.

- [x] Design it (spec): [0001](../specs/0001-adopt-better-auth/index.md)
- [x] Build it: /develop authentication (code in `src/auth/`, `src/users/`, `src/main.ts`, `prisma/`)
  - [x] Config & schema: env vars, `auth.ts` (Prisma adapter, `admin`/`bearer` plugins), generated Prisma schema and migration, satisfies AC-1, AC-2, AC-3, AC-5, AC-6, AC-7, AC-8
  - [x] NestJS wiring: `main.ts` body parser handling, the hand rolled `AuthGuard`/admin check/`@Session()` decorator, satisfies AC-1, AC-2, AC-3, AC-4, AC-6
  - [x] Users module rewrite: remove `POST /users`, guard `GET /users` (admin) and `GET /users/:id` (self or admin), satisfies AC-3, AC-5, AC-8
  - [x] Admin bootstrap script, satisfies AC-9
  - [x] README update (stack, API, env vars, design notes)
- [ ] Verify it: /check verify authentication

## Deferred

- Password reset (forgot password): needs an email provider, none configured yet. See spec 0001 Follow-up.
- Email verification: same reason.
