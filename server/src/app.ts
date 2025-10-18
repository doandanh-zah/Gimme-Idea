import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';
import { sendSuccess } from './utils/response.js';
import apiRouter from './routes/index.js';

dotenv.config();

const app = express();

// CORS must come BEFORE helmet
app.use(cors({ origin: process.env.CLIENT_URL?.split(',') || '*', credentials: true }));

// Configure helmet to be less strict in development
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
}));

app.use(express.json({ limit: '1mb' }));
app.use(generalLimiter);

app.get('/api/health', (_req, res) => sendSuccess(res, { status: 'ok' }));

app.use('/api', apiRouter);

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

app.use(errorHandler);

export default app;

