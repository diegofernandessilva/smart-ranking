import { z } from 'zod';

export const envSchema = z.object({
  APP_PORT: z.coerce.number().default(3004),
  MONGODB_URL: z.string().url(),
  RABBITMQ_URL: z.string(),
  RABBITMQ_USER: z.string().default('admin'),
  RABBITMQ_PASSWORD: z.string().default('admin'),
  RABBITMQ_VHOST: z.string().default('smartranking'),
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
