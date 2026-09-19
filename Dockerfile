# ---------- Stage 1: build ----------
# Installs ALL dependencies (incl. dev tools like the Nest CLI and TypeScript),
# generates the Prisma client, and compiles src/ -> dist/.
# Nothing from this stage ships except the dist/ folder.
FROM node:24-alpine AS build

WORKDIR /app

# Copy only what `npm ci` needs first, so this layer is cached and
# dependencies are not reinstalled every time a source file changes.
COPY package.json package-lock.json ./
# postinstall runs `prisma generate`, which needs the schema + config present.
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm ci

# Now the source. Changing these only re-runs the steps below.
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src

RUN npm run build


# ---------- Stage 2: runtime ----------
# A fresh, small image with only production dependencies + compiled output.
FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
# --omit=dev   : skip devDependencies (no TypeScript, no Nest CLI, no vitest)
# --ignore-scripts : skip postinstall; the client is already compiled into dist/
RUN npm ci --omit=dev --ignore-scripts

# Compiled app from stage 1
COPY --from=build /app/dist ./dist
# Needed at startup by `prisma migrate deploy` (prestart:prod)
COPY prisma ./prisma
COPY prisma.config.ts ./

# Documentation only: tells readers/tools which port the app listens on.
# Actual publishing to your PC happens with `docker run -p`.
EXPOSE 3000

# Don't run as root inside the container.
USER node

# prestart:prod -> prisma migrate deploy, then start:prod -> node dist/main
CMD ["npm", "run", "start:prod"]
