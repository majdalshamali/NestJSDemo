// Loads .env into process.env. Must be the FIRST import: AppModule reads
// process.env.ARCJET_KEY while it is being defined, which happens as soon as
// the import below is evaluated.
import 'dotenv/config';

import express from 'express';
import { NestFactory } from '@nestjs/core';
import { toNodeHandler } from 'better-auth/node';
import { AppModule } from './app.module.js';
import { auth } from './auth/auth.js';

async function bootstrap() {
  // Better Auth needs the raw, unparsed request body, so Nest's automatic
  // body parser is disabled here and re-enabled below for every other
  // route. This is a global switch, not one scoped to /api/auth, so it has
  // to happen at this level rather than per controller.
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const expressApp = app.getHttpAdapter().getInstance();

  // Registered as a direct Express route (not app.use(prefix, ...)), so
  // req.url stays the full path; app.use() would strip the mount prefix,
  // and Better Auth matches routes against its configured basePath
  // (/api/auth by default), which needs that full path.
  expressApp.all('/api/auth/*splat', toNodeHandler(auth));

  // Restores body parsing for every route outside /api/auth/*, which the
  // line above never reaches (its handler ends the response itself).
  expressApp.use(express.json());

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
