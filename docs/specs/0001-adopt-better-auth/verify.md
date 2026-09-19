# Verify: authentication · spec 0001 · updated 2026-09-19

_Steps derived from spec 0001 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## Commands

- [x] `curl -X POST /api/auth/sign-up/email -d '{"email":"a@b.com","password":"correcthorse123","name":"A"}'` → `200`, body includes `"role":"user"` and a `set-auth-token` response header → AC-1
- [x] Repeat the same sign up with the same email → `422`, no user created a second time → AC-1, AC-8
- [x] `curl -X POST /api/auth/sign-in/email` with the correct password → `200` + `set-auth-token` header → AC-2
- [x] Same call with the wrong password → `401`, same response shape as an unknown email (below) → AC-2
- [x] Same call with an email that never signed up → `401`, same response shape as a wrong password above (don't leak which one was wrong) → AC-2
- [x] `GET /users/:id` using the signed in user's own id and their bearer token → `200`, returns that user → AC-3
- [x] `GET /users/:id` using a *different* user's id, non admin token → `403` → AC-3
- [x] `GET /users/:id` with no `Authorization` header → `401` → AC-4
- [x] `GET /users/:id` with a garbage/expired bearer token → `401` → AC-4
- [x] `GET /users` (list) with a non admin token → `403` → AC-5
- [x] `GET /users` (list) with an admin token (promote via `npm run seed:admin -- <email>` first) → `200`, full list → AC-5, AC-9
- [ ] Fire sign in attempts past Better Auth's default sensitive endpoint limit (3 per 10s) → eventually `429` → AC-6 (FAILS under the project's normal run commands; only passes with `NODE_ENV=production` set, see report)
- [x] Restart the server, repeat the burst immediately → still rate limited (not reset), confirming counters persisted in the `rateLimit` table rather than in memory → AC-6 (proven via direct DB inspection: the `rateLimit` row survived three separate process restarts)
- [x] Sign in as a user, capture their token, then have an admin call `POST /api/auth/admin/ban-user` with that user's id → the *same, already issued* token then gets `401` on its next request (Better Auth revokes the user's sessions on ban; `AuthGuard` also checks `banned` directly as a second line of defence) → AC-7
- [x] `POST /users` → `404` (route no longer exists) → AC-8
- [x] `npm run seed:admin -- <email>` for a user that exists → exits 0, prints confirmation, and that user's `GET /users` now succeeds → AC-9
- [x] `npm run seed:admin -- <email>` for an email with no account → clear error, exits non-zero, no crash → AC-9

## Acceptance-criteria coverage

- AC-1: sign up (success + bearer token issuance) · AC-2: sign in (success + generic failure) · AC-3: self/admin ownership on `GET /users/:id` · AC-4: no-token rejection · AC-5: admin-only `GET /users` · AC-6: rate limiting, including DB persistence across a restart · AC-7: banned user's existing session stops working · AC-8: `POST /users` removed · AC-9: seed script promotes an existing user to admin
