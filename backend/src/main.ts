import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { json, urlencoded } from "express";
import helmet from "helmet";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers with Helmet
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images from other origins
    })
  );

  // Enable CORS
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  app.enableCors({
    origin: [frontendUrl, "http://localhost:3000"],
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
    console.log(`🌐 CORS enabled for: ${frontendUrl}`);
    console.log(`�️ Security: Helmet enabled, Rate limit: 100 req/min`);
  }
}

bootstrap();
