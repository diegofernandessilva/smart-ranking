import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { AbstractUseCase } from '~/common/abstract-use-case';
import { AbstractUserRepository } from '~/modules/auth/application/gateways/repositories/abstract-user.repository';
import { IUserProps } from '~/modules/auth/domain/entities/user.interface';
import {
  IForgotPasswordUseCaseInput,
  IForgotPasswordUseCaseOutput,
} from './forgot-password.interface';

const RESET_TOKEN_EXPIRATION_MS = 60 * 60 * 1000; // 1 hour (RN-045)

@Injectable()
export class ForgotPasswordUseCase extends AbstractUseCase<
  IForgotPasswordUseCaseInput,
  IForgotPasswordUseCaseOutput
> {
  private readonly logger = new Logger(ForgotPasswordUseCase.name);

  constructor(
    private readonly userRepository: AbstractUserRepository,
  ) {
    super();
  }

  async execute(
    input: IForgotPasswordUseCaseInput,
  ): Promise<IForgotPasswordUseCaseOutput> {
    // ALWAYS returns void (200) — never reveal if email exists (RN-047)
    const user = await this.userRepository.findByEmail(input.email);

    if (!user) {
      // Log for monitoring but do NOT reveal to client
      this.logger.debug(
        'Password reset requested for non-existent email',
      );
      return;
    }

    // Generate reset token: crypto.randomBytes(32)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRATION_MS);

    // Store SHA-256 hash of token (replaces any existing token)
    const updateData: Partial<IUserProps> = {
      passwordResetToken: tokenHash,
      passwordResetExpires: expiresAt,
    };
    await this.userRepository.update(user.id, updateData);

    // TODO: Task 6.0/12.0 — Emit event to notification queue with rawToken + email
    // For now, log the raw token (development only)
    this.logger.log(
      `Password reset token generated for user ${user.id}`,
    );
  }
}
