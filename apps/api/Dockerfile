FROM node:22.23.2-slim AS build
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @gimme-idea/api... build
CMD ["node", "apps/api/dist/server.js"]
