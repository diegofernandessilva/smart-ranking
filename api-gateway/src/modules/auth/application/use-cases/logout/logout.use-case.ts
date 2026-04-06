import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { AbstractUseCase } from '~/common/abstract-use-case';
import { AbstractRefreshTokenRepository } from '~/modules/auth/application/gateways/repositories/abstract-refresh-token.repository';
import {
  ILogoutUseCaseInput,
  ILogoutUseCaseOutput,
} from './logout.interface';

@Injectable()
export class LogoutUseCase extends AbstractUseCase<
  ILogoutUseCaseInput,
  ILogoutUseCaseOutput
> {
  constructor(
    private readonly refreshTokenRepository: AbstractRefreshTokenRepository,
  ) {
    super();
  }

  async execute(input: ILogoutUseCaseInput): Promise<ILogoutUseCaseOutput> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(input.refreshToken)
      .digest('hex');

    await this.refreshTokenRepository.revokeByTokenHash(tokenHash);
  }
}
