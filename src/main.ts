// Loads .env into process.env. Must be the FIRST import: AppModule reads
// process.env.ARCJET_KEY while it is being defined, which happens as soon as
// the import below is evaluated.
import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
