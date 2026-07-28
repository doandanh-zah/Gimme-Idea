import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { json, urlencoded } from "express";
const helmet = require("helmet");

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Render/Cloudflare/Vercel sit in front of the API. Trusting the first proxy
  // lets Express expose the real client IP to Nest throttling via req.ip.
  app.set("trust proxy", 1);

  // Security headers with Helmet
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images from other origins
    })
  );

  // Enable CORS with an explicit allowlist. Configure production origins through
  // CORS_ORIGINS="https://app.example.com,https://www.example.com".
  const configuredOrigins = (
    process.env.CORS_ORIGINS ||
    process.env.FRONTEND_URL ||
    "http://localhost:3000"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = new Set([
    ...configuredOrigins,
    ...(process.env.NODE_ENV === "production"
      ? []
      : ["http://localhost:3000", "http://localhost:3001"]),
  ]);
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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

  // Global prefix for all routes
  app.setGlobalPrefix("api");

  const port = process.env.PORT || 3001;
  await app.listen(port);

  // Only log in development
  if (process.env.NODE_ENV !== "production") {
    console.log(`🚀 Backend server is running on: http://localhost:${port}`);
    console.log(`📡 API available at: http://localhost:${port}/api`);
    console.log(`🌐 CORS enabled for: ${Array.from(allowedOrigins).join(", ")}`);
    console.log(`Security: Helmet enabled, Rate limit: 300 req/min`);
  }
}

bootstrap();
