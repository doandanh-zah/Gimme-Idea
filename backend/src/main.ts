import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { json, urlencoded } from "express";
const helmet = require("helmet");

function buildCorsOrigins(): string[] {
  const defaults = [
    "http://localhost:3000",
    "https://gimmeidea.com",
    "https://www.gimmeidea.com",
    "https://mobile.gimmeidea.com",
    "https://www.mobile.gimmeidea.com",
    "https://kora.devnet.lazorkit.com",
  ];

  const fromEnv = [
    process.env.FRONTEND_URL,
    ...(process.env.CORS_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  ].filter(Boolean) as string[];

  return Array.from(new Set([...defaults, ...fromEnv]));
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Behind Render / reverse proxies
  app.getHttpAdapter().getInstance().set("trust proxy", 1);

  // Security headers with Helmet
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images from other origins
    })
  );

  // Enable CORS for production frontend domains + env extras
  const corsOrigins = buildCorsOrigins();
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "Origin",
      "X-Requested-With",
    ],
  });

  // Increase body size limit for base64 images (up to 10MB)
  app.use(json({ limit: "10mb" }));
  app.use(urlencoded({ limit: "10mb", extended: true }));

  // Enable validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Global prefix for API routes
  app.setGlobalPrefix("api");

  // Root health endpoints (not under /api) — Render often probes "/" by default
  const http = app.getHttpAdapter().getInstance();
  const health = (_req: any, res: any) => {
    res.status(200).json({
      success: true,
      message: "Gimme Idea API is running",
      timestamp: new Date().toISOString(),
    });
  };
  http.get("/", health);
  http.get("/health", health);

  const port = Number(process.env.PORT) || 3001;
  // Render requires binding 0.0.0.0; localhost-only bind causes 502 Bad Gateway
  await app.listen(port, "0.0.0.0");

  console.log(`Backend listening on 0.0.0.0:${port}`);
  console.log(`API: /api  health: / and /health`);
  console.log(`CORS origins: ${corsOrigins.join(", ")}`);
}

bootstrap();
