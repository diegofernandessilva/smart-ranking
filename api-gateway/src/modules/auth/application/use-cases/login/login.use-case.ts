import {
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import type { StringValue } from 'ms';
import { AbstractUseCase } from '~/common/abstract-use-case';
import { AbstractIdGenerator } from '~/modules/auth/application/gateways/providers/abstract-id-generator';
import { AbstractUserRepository } from '~/modules/auth/application/gateways/repositories/abstract-user.repository';
import { AbstractRefreshTokenRepository } from '~/modules/auth/application/gateways/repositories/abstract-refresh-token.repository';
import { RefreshTokenEntity } from '~/modules/auth/domain/entities/refresh-token.entity';
import { IUserProps } from '~/modules/auth/domain/entities/user.interface';
import { UserMapper } from '~/modules/auth/domain/mappers/user.mapper';
import { ILoginUseCaseInput, ILoginUseCaseOutput } from './login.interface';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

@Injectable()
export class LoginUseCase extends AbstractUseCase<
  ILoginUseCaseInput,
  ILoginUseCaseOutput
> {
  constructor(
    private readonly userRepository: AbstractUserRepository,
    private readonly refreshTokenRepository: AbstractRefreshTokenRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly idGenerator: AbstractIdGenerator,
  ) {
    super();
  }

  async execute(input: ILoginUseCaseInput): Promise<ILoginUseCaseOutput> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isLocked()) {
      const remainingMs =
        user.lockedUntil!.getTime() - Date.now();
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      throw new HttpException(
        `Account temporarily locked. Try again in ${remainingMinutes} minutes`,
        HttpStatus.LOCKED,
      );
    }

    const passwordValid = await bcrypt.compare(
      input.password,
      user.password.value,
    );

    if (!passwordValid) {
      user.incrementFailedLoginAttempts();

      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lock(LOCKOUT_DURATION_MS);
      }

      const lockoutUpdate: Partial<IUserProps> = {
        failedLoginAttempts: user.failedLoginAttempts,
        lockedUntil: user.lockedUntil,
      };
      await this.userRepository.update(user.id, lockoutUpdate);

      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.failedLoginAttempts > 0) {
      user.resetFailedLoginAttempts();
      const resetUpdate: Partial<IUserProps> = {
        failedLoginAttempts: 0,
        lockedUntil: undefined,
      };
      await this.userRepository.update(user.id, resetUpdate);
    }

    const signOptions: JwtSignOptions = {
      privateKey: this.configService.get<string>('JWT_PRIVATE_KEY'),
      algorithm: 'RS256',
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION') as StringValue,
    };

    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email.value,
        role: user.role,
      },
      signOptions,
    );

    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(rawRefreshToken)
      .digest('hex');

    const refreshExpirationDays = this.configService.get<number>(
      'JWT_REFRESH_EXPIRATION_DAYS',
    )!;
    const expiresAt = new Date(
      Date.now() + refreshExpirationDays * 24 * 60 * 60 * 1000,
    );

    const refreshTokenEntity = RefreshTokenEntity.create(
      this.idGenerator.generate(),
      {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt,
      },
    );

    await this.refreshTokenRepository.create(refreshTokenEntity);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: UserMapper.toDto(user),
    };
  }
}
