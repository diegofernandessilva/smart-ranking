import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './env.validation';

export const EnvConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  validate: validateEnv,
});
