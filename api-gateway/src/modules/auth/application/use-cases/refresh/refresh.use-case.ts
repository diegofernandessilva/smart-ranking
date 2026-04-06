import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import type { StringValue } from 'ms';
import * as crypto from 'crypto';
import { AbstractUseCase } from '~/common/abstract-use-case';
import { AbstractIdGenerator } from '~/modules/auth/application/gateways/providers/abstract-id-generator';
import { AbstractUserRepository } from '~/modules/auth/application/gateways/repositories/abstract-user.repository';
import { AbstractRefreshTokenRepository } from '~/modules/auth/application/gateways/repositories/abstract-refresh-token.repository';
import { RefreshTokenEntity } from '~/modules/auth/domain/entities/refresh-token.entity';
import {
  IRefreshUseCaseInput,
  IRefreshUseCaseOutput,
} from './refresh.interface';

@Injectable()
export class RefreshUseCase extends AbstractUseCase<
  IRefreshUseCaseInput,
  IRefreshUseCaseOutput
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

  async execute(
    input: IRefreshUseCaseInput,
  ): Promise<IRefreshUseCaseOutput> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(input.refreshToken)
      .digest('hex');

    const existingToken =
      await this.refreshTokenRepository.findByTokenHash(tokenHash);

    if (!existingToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (existingToken.isRevoked) {
      // Stolen token detection: reuse of already-rotated token
      // Invalidate ALL tokens for this user (RN-044)
      await this.refreshTokenRepository.revokeAllByUserId(
        existingToken.userId,
      );
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (existingToken.isExpired()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userRepository.findById(existingToken.userId);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Generate new refresh token (rotation - RN-043)
    const newRawRefreshToken = crypto.randomBytes(32).toString('hex');
    const newRefreshTokenHash = crypto
      .createHash('sha256')
      .update(newRawRefreshToken)
      .digest('hex');

    // Mark old token as replaced
    existingToken.replaceWith(newRefreshTokenHash);
    await this.refreshTokenRepository.revokeByTokenHash(tokenHash);

    const refreshExpirationDays = this.configService.get<number>(
      'JWT_REFRESH_EXPIRATION_DAYS',
    )!;
    const expiresAt = new Date(
      Date.now() + refreshExpirationDays * 24 * 60 * 60 * 1000,
    );

    const newRefreshTokenEntity = RefreshTokenEntity.create(
      this.idGenerator.generate(),
      {
        userId: user.id,
        tokenHash: newRefreshTokenHash,
        expiresAt,
      },
    );

    await this.refreshTokenRepository.create(newRefreshTokenEntity);

    // Generate new access token
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

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
    };
  }
}
