Gimme Idea - Backend Server (Scaffold)

Quick start
- Copy .env.example to .env and fill values
- Install: npm install
- Prisma: npx prisma generate && npx prisma migrate dev --name init
- Dev server: npm run dev (http://localhost:5000/api/health)

Stack
- Node.js + Express + TypeScript
- PostgreSQL + Prisma
- Zod validation, JWT auth (stubs), rate limiting, Helmet, CORS
- Winston logger, unified response format

Structure
- src/app.ts: Express app with middleware
- src/server.ts: Entrypoint
- src/routes/*: Routers (auth stub included)
- src/controllers/*: Controllers (auth stubs)
- src/middleware/*: Validation, auth, rate limit, error handler
- src/prisma/client.ts: Prisma client
- prisma/schema.prisma: DB schema

Next steps
- Implement auth service (register/verify/login/refresh/logout/reset)
- Add project/feedback/payment routes and controllers
- Integrate Redis/Bull, Stripe, SendGrid, Cloudinary
- Write unit/integration tests (Jest + Supertest)

