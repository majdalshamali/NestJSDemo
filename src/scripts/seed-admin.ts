// One time admin bootstrap. There is no self service way to become an admin
// (by design, see docs/specs/0001-adopt-better-auth.md); this script is how
// the first admin gets created, after that user has already signed up.
//
// Usage: npm run seed:admin -- <email>
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '../generated/prisma/client.js';

const email = process.argv[2];
if (!email) {
  console.error('Usage: npm run seed:admin -- <email>');
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env['DATABASE_URL'] }),
});

try {
  const user = await prisma.user.update({
    where: { email },
    data: { role: 'admin' },
  });
  console.log(`${user.email} (${user.id}) is now an admin.`);
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
    console.error(
      `No user with email "${email}" was found. They need to sign up first.`,
    );
    process.exit(1);
  }
  throw e;
} finally {
  await prisma.$disconnect();
}
