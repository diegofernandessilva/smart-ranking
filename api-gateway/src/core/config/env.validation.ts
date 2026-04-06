import { z } from 'zod';

export const envSchema = z.object({
  APP_PORT: z.coerce.number().default(3000),
  MONGODB_URL: z.string().url(),
  RABBITMQ_HOST: z.string().default('localhost'),
  RABBITMQ_PORT: z.coerce.number().default(5672),
  RABBITMQ_USER: z.string().default('admin'),
  RABBITMQ_PASSWORD: z.string().default('admin'),
  RABBITMQ_VHOST: z.string().default('smartranking'),
  OUTBOX_BATCH_SIZE: z.coerce.number().default(10),
  JWT_PRIVATE_KEY: z.string().min(1),
  JWT_PUBLIC_KEY: z.string().min(1),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION_DAYS: z.coerce.number().default(7),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${formatted}`);
  }
  return parsed.data as unknown as Record<string, unknown>;
}
