# ---------- Stage 1: build ----------
# Installs ALL dependencies (incl. dev tools like the Nest CLI and TypeScript),
# generates the Prisma client, and compiles src/ -> dist/.
# Only dist/ and the pruned node_modules/ ship from this stage.
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

# Drop devDependencies now that the build is done. What remains is exactly
# the production node_modules, with Prisma's engines already downloaded by
# their postinstall scripts (a second `npm ci --ignore-scripts` would skip
# that download, and the unprivileged runtime user can't fetch them later).
RUN npm prune --omit=dev


# ---------- Stage 2: runtime ----------
# A fresh, small image with only production dependencies + compiled output.
FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production

# --chown makes the unprivileged `node` user own the files, so Prisma can
# write inside node_modules if it ever needs to.
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node package.json ./
# Needed at startup by `prisma migrate deploy` (prestart:prod)
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node prisma.config.ts ./

# Documentation only: tells readers/tools which port the app listens on.
# Actual publishing to your PC happens with `docker run -p`.
EXPOSE 3000

# Don't run as root inside the container.
USER node

# prestart:prod -> prisma migrate deploy, then start:prod -> node dist/main
CMD ["npm", "run", "start:prod"]
