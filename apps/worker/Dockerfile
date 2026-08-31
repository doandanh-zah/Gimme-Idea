FROM node:22.23.2-slim AS build
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @gimme-idea/worker... build
CMD ["node", "apps/worker/dist/server.js"]
