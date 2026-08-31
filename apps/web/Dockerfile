FROM node:22.23.2-slim AS build
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @gimme-idea/web... build
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
