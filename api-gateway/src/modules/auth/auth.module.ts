import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { AbstractUserRepository } from './application/gateways/repositories/abstract-user.repository';
import { AbstractRefreshTokenRepository } from './application/gateways/repositories/abstract-refresh-token.repository';
import { AbstractIdGenerator } from './application/gateways/providers/abstract-id-generator';
import { RegisterUseCase } from './application/use-cases/register/register.use-case';
import { LoginUseCase } from './application/use-cases/login/login.use-case';
import { RefreshUseCase } from './application/use-cases/refresh/refresh.use-case';
import { LogoutUseCase } from './application/use-cases/logout/logout.use-case';
import { ChangePasswordUseCase } from './application/use-cases/change-password/change-password.use-case';
import { ForgotPasswordUseCase } from './application/use-cases/forgot-password/forgot-password.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password/reset-password.use-case';
import { GetMeUseCase } from './application/use-cases/get-me/get-me.use-case';
import { MongooseUserRepository } from './infra/gateways/repositories/mongoose/mongoose-user.repository';
import { MongooseRefreshTokenRepository } from './infra/gateways/repositories/mongoose/mongoose-refresh-token.repository';
import { MongooseIdGenerator } from './infra/gateways/providers/mongoose-id-generator';
import { UserModel, UserSchema } from './infra/schemas/user.schema';
import {
  RefreshTokenModel,
  RefreshTokenSchema,
} from './infra/schemas/refresh-token.schema';
import { JwtStrategy } from './infra/strategies/jwt.strategy';
import { AuthController } from './infra/controllers/auth.controller';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: UserModel.name, schema: UserSchema },
      { name: RefreshTokenModel.name, schema: RefreshTokenSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    // Strategy
    JwtStrategy,

    // Repository bindings (abstract -> concrete)
    {
      provide: AbstractUserRepository,
      useClass: MongooseUserRepository,
    },
    {
      provide: AbstractRefreshTokenRepository,
      useClass: MongooseRefreshTokenRepository,
    },

    // Provider bindings
    {
      provide: AbstractIdGenerator,
      useClass: MongooseIdGenerator,
    },

    // Use cases
    RegisterUseCase,
    LoginUseCase,
    RefreshUseCase,
    LogoutUseCase,
    ChangePasswordUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,
    GetMeUseCase,
  ],
})
export class AuthModule {}
