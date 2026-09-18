# NestJS Demo

A learning project: a [NestJS](https://nestjs.com) 12 REST API with
[Arcjet](https://arcjet.com) request protection and a
[Prisma](https://www.prisma.io) 7 data layer backed by Prisma Postgres.

Built step by step as a first NestJS project. Each commit is a working,
tested increment.

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Runtime | Node.js 24 (LTS) | managed with nvm-windows |
| Framework | NestJS 12 | ESM (`"type": "module"`), TypeScript strict |
| Security | `@arcjet/node` | Shield (WAF), rate limiting, bot detection, email validation |
| ORM | Prisma 7.10 | `@prisma/adapter-pg` driver adapter (required in Prisma 7) |
| Database | Prisma Postgres | hosted; local Postgres works too, only `DATABASE_URL` changes |
| Lint / format | oxlint, Prettier | |
| Tests | vitest | |

## Project layout

```
prisma/
  schema.prisma              data model (User); source of truth for the DB
  migrations/                generated SQL, one folder per migration
prisma.config.ts             Prisma 7 config (schema path, migrations dir, DATABASE_URL)
src/
  main.ts                    bootstrap; loads .env first
  app.module.ts              root module
  arcjet/
    arcjet.client.ts         Arcjet client + the rules used by the demo routes
    arcjet.guard.ts          Nest guard applying Shield to a route/controller
  prisma/
    prisma.service.ts        PrismaClient wrapped as an injectable, connects on startup
    prisma.module.ts         @Global so any module can inject PrismaService
  protected/
    protected.controller.ts  /api/* routes, one per Arcjet rule
  users/
    users.controller.ts      /users REST endpoints
    users.service.ts         business logic against Prisma
  generated/prisma/          typed Prisma client (gitignored, regenerated)
```

## Prerequisites

- Node.js >= 22.18 (24 LTS recommended)
- npm
- An [Arcjet](https://app.arcjet.com) account (free) for `ARCJET_KEY`
- A [Prisma Postgres](https://console.prisma.io) database (free tier) for
  `DATABASE_URL`, or any PostgreSQL you can reach

On Windows, if `npm`/`nest` refuse to run with "running scripts is disabled",
allow local scripts once:

```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Install

```bash
git clone https://github.com/majdalshamali/NestJSDemo.git
cd NestJSDemo
npm install
```

`npm install` also runs Prisma's install scripts; they are pre-approved in
`package.json` under `allowScripts`.

## Configure

Copy the example env file and fill in the two secrets:

```bash
cp .env.example .env
```

| Variable | Purpose |
|---|---|
| `ARCJET_KEY` | site key from app.arcjet.com |
| `ARCJET_MODE` | `LIVE` blocks requests; `DRY_RUN` only logs what *would* be blocked |
| `ARCJET_ENV` | `development` lets Arcjet accept localhost / private IPs |
| `DATABASE_URL` | PostgreSQL connection string (Prisma Postgres gives you one) |

`.env` is gitignored. Never commit it.

## Database

For local development, apply migrations and generate the typed client:

```bash
npx prisma migrate dev
```

`npm install` also regenerates the client automatically (`postinstall` runs
`prisma generate`), so a fresh clone only needs the command above to create
the database tables.

Other useful commands:

```bash
npx prisma migrate dev --name <change>   # after editing schema.prisma
npx prisma generate                      # regenerate the client only
npx prisma migrate deploy                # apply pending migrations, no prompts (prod)
npx prisma studio                        # browse data in a web UI
npx prisma validate                      # check schema + config
```

## Run

```bash
npm run start:dev      # watch mode, recompiles on save
npm run start          # single run
npm run build && npm run start:prod   # compiled output from dist/
```

`npm run start:prod` runs `prisma migrate deploy` first (via the
`prestart:prod` script), so pending migrations are applied automatically
before the server starts. It never prompts and never creates new migrations —
those still come from `prisma migrate dev` during development.

The server listens on http://localhost:3000 (override with `PORT`).

## API

### Users (`/users`) — Prisma

| Method | Path | Body | Responses |
|---|---|---|---|
| `POST` | `/users` | `{ "email": string, "name"?: string }` | `201` created · `400` missing email · `409` email already exists |
| `GET` | `/users` | | `200` list, newest first |
| `GET` | `/users/:id` | | `200` · `400` non-numeric id · `404` not found |

```bash
curl.exe -s -X POST http://localhost:3000/users -H "Content-Type: application/json" -d "{\"email\":\"a@b.com\",\"name\":\"Majd\"}"
curl.exe -s http://localhost:3000/users
curl.exe -s http://localhost:3000/users/1
```

### Arcjet demos (`/api`) — one route per rule

Shield (the WAF) runs on every request through the Arcjet client. The other
rules are attached per route with `withRule()` so the scenarios don't interfere
with each other.

| Route | Rule | Try | Expect |
|---|---|---|---|
| `GET /api/limited` | fixed window, 5 req / 10 s per IP | 8 quick requests | 5 × `200`, then `429` |
| `GET /api/bots` | `detectBot({ allow: [] })` | `curl` user agent | `403`; a browser UA gets `200` |
| `GET /api/shielded?q=` | Shield via `ArcjetGuard` | `?q=' OR 1=1--` | `403` (Shield weighs patterns; a single request may pass) |
| `POST /api/signup` | `validateEmail` denying disposable / invalid / no-MX | `{"email":"x@mailinator.com"}` | `400`; a real address gets `200` |

Denied responses name the rule that fired, e.g. `{"error":"Rate limit exceeded","rule":"fixedWindow"}`.

```powershell
# rate limit
1..8 | % { $r = try { iwr http://localhost:3000/api/limited -UseBasicParsing } catch { $_.Exception.Response }; "$_`: $($r.StatusCode)" }
```
```bash
# bot detection
curl.exe -s -o NUL -w "%{http_code}\n" -A "curl/8.0" http://localhost:3000/api/bots
# email validation
curl.exe -s -X POST http://localhost:3000/api/signup -H "Content-Type: application/json" -d "{\"email\":\"test@mailinator.com\"}"
```

Set `ARCJET_MODE=DRY_RUN` to observe decisions in the server log without
blocking anything — useful before enabling rules in production.

## Quality

```bash
npm run lint           # oxlint
npm run format         # prettier
npm test               # unit tests (vitest)
npm run test:e2e       # end-to-end tests
```

## Design notes

- **`@arcjet/node` rather than `@arcjet/nest`** — the Nest package's peer range
  stops at NestJS 11; this project is on 12. The plain Node SDK has no Nest peer
  dependency, and the guard is a few lines of our own code.
- **Generated Prisma client lives in `src/generated/`** — `tsconfig.build.json`
  sets `rootDir` to `src`, so the client must be under it for `nest build`.
  The generator is configured for ESM (`moduleFormat = "esm"`,
  `importFileExtension = "js"`) to match `module: "nodenext"`.
- **`dotenv/config` is the first import in `main.ts`** — module decorators read
  `process.env` while modules are being *defined*, before any Nest lifecycle
  hook runs, so the env file has to be loaded before `AppModule` is imported.
- **Unique-constraint errors map to `409`** — Prisma error `P2002` is caught in
  `UsersService.create`; without that it surfaces as a misleading `500`.

## License

UNLICENSED — personal learning project.
