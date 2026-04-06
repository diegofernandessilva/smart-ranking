import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AbstractUseCase } from '~/common/abstract-use-case';
import { AbstractUserRepository } from '~/modules/auth/application/gateways/repositories/abstract-user.repository';
import { AbstractRefreshTokenRepository } from '~/modules/auth/application/gateways/repositories/abstract-refresh-token.repository';
import { Password } from '~/modules/auth/domain/value-objects/password.vo';
import { IUserProps } from '~/modules/auth/domain/entities/user.interface';
import {
  IChangePasswordUseCaseInput,
  IChangePasswordUseCaseOutput,
} from './change-password.interface';

const BCRYPT_SALT_ROUNDS = 12;

@Injectable()
export class ChangePasswordUseCase extends AbstractUseCase<
  IChangePasswordUseCaseInput,
  IChangePasswordUseCaseOutput
> {
  constructor(
    private readonly userRepository: AbstractUserRepository,
    private readonly refreshTokenRepository: AbstractRefreshTokenRepository,
  ) {
    super();
  }

  async execute(
    input: IChangePasswordUseCaseInput,
  ): Promise<IChangePasswordUseCaseOutput> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      input.currentPassword,
      user.password.value,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Validate new password via VO (throws if invalid)
    const newPassword = new Password(input.newPassword);

    // New password must differ from current
    const isSamePassword = await bcrypt.compare(
      newPassword.value,
      user.password.value,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword.value, BCRYPT_SALT_ROUNDS);
    const now = new Date();

    const updateData: Partial<IUserProps> = {
      password: Password.fromHash(hashedPassword),
      lastPasswordChange: now,
    };
    await this.userRepository.update(user.id, updateData);

    // Invalidate ALL refresh tokens (RN-046: force re-login on all devices)
    await this.refreshTokenRepository.revokeAllByUserId(user.id);
  }
}
