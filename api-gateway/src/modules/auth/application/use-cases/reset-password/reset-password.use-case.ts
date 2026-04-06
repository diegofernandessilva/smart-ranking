import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AbstractUseCase } from '~/common/abstract-use-case';
import { AbstractUserRepository } from '~/modules/auth/application/gateways/repositories/abstract-user.repository';
import { AbstractRefreshTokenRepository } from '~/modules/auth/application/gateways/repositories/abstract-refresh-token.repository';
import { Password } from '~/modules/auth/domain/value-objects/password.vo';
import { IUserProps } from '~/modules/auth/domain/entities/user.interface';
import {
  IResetPasswordUseCaseInput,
  IResetPasswordUseCaseOutput,
} from './reset-password.interface';

const BCRYPT_SALT_ROUNDS = 12;

@Injectable()
export class ResetPasswordUseCase extends AbstractUseCase<
  IResetPasswordUseCaseInput,
  IResetPasswordUseCaseOutput
> {
  constructor(
    private readonly userRepository: AbstractUserRepository,
    private readonly refreshTokenRepository: AbstractRefreshTokenRepository,
  ) {
    super();
  }

  async execute(
    input: IResetPasswordUseCaseInput,
  ): Promise<IResetPasswordUseCaseOutput> {
    // Hash the provided token with SHA-256 and compare with stored hash
    const tokenHash = crypto
      .createHash('sha256')
      .update(input.token)
      .digest('hex');

    const user = await this.userRepository.findByResetToken(tokenHash);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Verify token has not expired (RN-045: 1 hour TTL)
    if (
      !user.passwordResetExpires ||
      user.passwordResetExpires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Validate new password via VO (throws if invalid)
    const newPassword = new Password(input.newPassword);

    const hashedPassword = await bcrypt.hash(
      newPassword.value,
      BCRYPT_SALT_ROUNDS,
    );
    const now = new Date();

    // Update password + clear reset token (single-use) + update lastPasswordChange
    const updateData: Partial<IUserProps> = {
      password: Password.fromHash(hashedPassword),
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
      lastPasswordChange: now,
    };
    await this.userRepository.update(user.id, updateData);

    // Invalidate ALL refresh tokens (force re-login)
    await this.refreshTokenRepository.revokeAllByUserId(user.id);
  }
}
