// Loads .env before anything below reads process.env. Needed both when Nest
// boots (main.ts already does this first) and when the `auth` CLI loads this
// file directly for `generate`/`migrate`, which does not go through main.ts.
import 'dotenv/config';

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins/admin';
import { bearer } from 'better-auth/plugins/bearer';
import { openAPI } from 'better-auth/plugins';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

// A standalone Prisma client, separate from the Nest managed PrismaService.
// This file must run outside Nest's DI lifecycle too (the `auth` CLI imports
// it directly to read the config), so it manages its own connection, the
// same way arcjet.client.ts manages its own singleton.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL'] }),
});

// BETTER_AUTH_SECRET and BETTER_AUTH_URL are read from the environment
// automatically; no need to pass them in here.
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
  },
  // admin() adds the "user" | "admin" role (new users always start at
  // "user", its default) plus ban fields. bearer() lets a client send
  // `Authorization: Bearer <token>` instead of a cookie; sign in/up return
  // the token in the `set-auth-token` response header. openAPI() serves a
  // reference page for these generated routes at /api/auth/reference,
  // since they never go through Nest's router and so are invisible to
  // @nestjs/swagger.
  plugins: [admin(), bearer(), openAPI()],
  rateLimit: {
    // Persists counters in Postgres so limits survive a restart, instead of
    // resetting every `nest start --watch` reload.
    storage: 'database',
  },
});
