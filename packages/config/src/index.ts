import { z } from 'zod';

const base = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export function apiEnv(input: NodeJS.ProcessEnv = process.env) {
  const parsed = base
    .extend({
      API_HOST: z.string().default('0.0.0.0'),
      API_PORT: z.coerce.number().int().positive().default(3001),
      DATABASE_URL: z.string().min(1),
      ENABLE_DEV_MOCK_AUTH: z
        .enum(['true', 'false'])
        .default('false')
        .transform((value) => value === 'true'),
      DEV_MOCK_WALLET_KEYPAIR_PATH: z.string().default('.local/gimme-devnet-wallet.keypair.json'),
      DEV_AUTH_SECRET: z.string().min(32).default('local-development-auth-secret-change-me'),
      PRIVY_APP_ID: z.string().optional(),
      PRIVY_APP_SECRET: z.string().optional(),
      PRIVY_VERIFICATION_KEY: z.string().optional(),
      CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
      RATE_LIMIT_MAX: z.coerce.number().int().positive().max(1_000_000).default(120),
      DEV_MOCK_RATE_LIMIT_MAX: z.coerce.number().int().positive().max(1_000).default(5),
      REDIS_URL: z.string().url().optional(),
      SOLANA_RPC_URL: z.string().url().default('https://api.devnet.solana.com'),
      SOLANA_CLUSTER: z.enum(['devnet', 'mainnet-beta']).default('devnet'),
      SOLANA_BOUNTY_PROGRAM_ID: z.string().default('BB2bMK8gwrDk3YG3GFECqnwnFigDoxvKDwJZiTXtzCK6'),
      CHAIN_WEBHOOK_SECRET: z.string().min(32).optional(),
      STORAGE_ENDPOINT: z.string().url().optional(),
      STORAGE_SERVICE_ROLE_KEY: z.string().optional(),
      AI_PROVIDER: z.enum(['disabled', 'openai_compatible']).default('disabled'),
      AI_API_URL: z.string().url().optional(),
      AI_API_KEY: z.string().optional(),
      AI_MODEL: z.string().optional(),
      COLOSSEUM_FEED_URL: z.string().url().optional(),
    })
    .parse(input);
  if (parsed.NODE_ENV === 'production') {
    if (parsed.ENABLE_DEV_MOCK_AUTH)
      throw new Error('ENABLE_DEV_MOCK_AUTH must be false in production.');
    if (!parsed.PRIVY_APP_ID || !parsed.PRIVY_APP_SECRET)
      throw new Error('Privy server credentials are required in production.');
    if (!parsed.REDIS_URL) throw new Error('REDIS_URL is required in production.');
    if (!parsed.STORAGE_ENDPOINT || !parsed.STORAGE_SERVICE_ROLE_KEY)
      throw new Error('Object storage credentials are required in production.');
  }
  return parsed;
}

export function workerEnv(input: NodeJS.ProcessEnv = process.env) {
  return base
    .extend({
      WORKER_HOST: z.string().default('0.0.0.0'),
      WORKER_PORT: z.coerce.number().int().positive().default(3002),
      DATABASE_URL: z.string().min(1),
      REDIS_URL: z.string().url(),
      SOLANA_RPC_URL: z.string().url().default('https://api.devnet.solana.com'),
      SOLANA_CLUSTER: z.enum(['devnet', 'mainnet-beta']).default('devnet'),
      SOLANA_BOUNTY_PROGRAM_ID: z.string().default('BB2bMK8gwrDk3YG3GFECqnwnFigDoxvKDwJZiTXtzCK6'),
      AI_PROVIDER: z.enum(['disabled', 'openai_compatible']).default('disabled'),
      AI_API_URL: z.string().url().optional(),
      AI_API_KEY: z.string().optional(),
      AI_MODEL: z.string().optional(),
      COLOSSEUM_FEED_URL: z.string().url().optional(),
    })
    .parse(input);
}
