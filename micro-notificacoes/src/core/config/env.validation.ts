import { z } from 'zod';

export const envSchema = z.object({
  APP_PORT: z.coerce.number().default(3003),
  MONGODB_URL: z.string().url(),
  RABBITMQ_HOST: z.string().default('localhost'),
  RABBITMQ_PORT: z.coerce.number().default(5672),
  RABBITMQ_USER: z.string().default('admin'),
  RABBITMQ_PASSWORD: z.string().default('admin'),
  RABBITMQ_VHOST: z.string().default('smartranking'),
  SES_SMTP_USER: z.string().optional(),
  SES_SMTP_PASS: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    throw new Error(
      `Environment validation error: ${parsed.error.message}`,
    );
  }

  return parsed.data;
}
