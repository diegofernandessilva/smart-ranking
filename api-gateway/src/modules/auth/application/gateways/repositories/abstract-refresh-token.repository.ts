import { RefreshTokenEntity } from '~/modules/auth/domain/entities/refresh-token.entity';

export abstract class AbstractRefreshTokenRepository {
  abstract create(token: RefreshTokenEntity): Promise<void>;
  abstract findByTokenHash(
    hash: string,
  ): Promise<RefreshTokenEntity | null>;
  abstract revokeByTokenHash(hash: string): Promise<void>;
  abstract revokeAllByUserId(userId: string): Promise<void>;
}
