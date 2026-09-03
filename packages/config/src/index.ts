import { z } from 'zod';

const base = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export function apiEnv(input: NodeJS.ProcessEnv = process.env) {
  return base
    .extend({
      API_HOST: z.string().default('0.0.0.0'),
      API_PORT: z.coerce.number().int().positive().default(3001),
      DATABASE_URL: z.string().min(1),
      ENABLE_DEV_MOCK_AUTH: z
        .enum(['true', 'false'])
        .default('true')
        .transform((value) => value === 'true'),
      DEV_MOCK_WALLET_KEYPAIR_PATH: z.string().default('.local/gimme-devnet-wallet.keypair.json'),
    })
    .parse(input);
}

export function workerEnv(input: NodeJS.ProcessEnv = process.env) {
  return base
    .extend({
      WORKER_HOST: z.string().default('0.0.0.0'),
      WORKER_PORT: z.coerce.number().int().positive().default(3002),
    })
    .parse(input);
}
