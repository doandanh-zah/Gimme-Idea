import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV !== 'production';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 100, // 1000 for dev, 100 for production
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 5, // 1000 for dev, 5 for production
  standardHeaders: true,
  legacyHeaders: false,
});

// For feedback posting; actual per-user-per-project logic enforced in handler
export const feedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 30, // 1000 for dev, 30 for production
  standardHeaders: true,
  legacyHeaders: false,
});

