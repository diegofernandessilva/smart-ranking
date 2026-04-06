import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as crypto from 'crypto';
import { LogoutUseCase } from './logout.use-case';
import { AbstractRefreshTokenRepository } from '~/modules/auth/application/gateways/repositories/abstract-refresh-token.repository';

const mockRefreshTokenRepository: Record<keyof AbstractRefreshTokenRepository, ReturnType<typeof vi.fn>> = {
  create: vi.fn(),
  findByTokenHash: vi.fn(),
  revokeByTokenHash: vi.fn(),
  revokeAllByUserId: vi.fn(),
};

const RAW_REFRESH_TOKEN = 'b'.repeat(64);

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new LogoutUseCase(
      mockRefreshTokenRepository as unknown as AbstractRefreshTokenRepository,
    );
  });

  it('should revoke the refresh token', async () => {
    mockRefreshTokenRepository.revokeByTokenHash.mockResolvedValue(undefined);
    const expectedHash = crypto
      .createHash('sha256')
      .update(RAW_REFRESH_TOKEN)
      .digest('hex');

    await useCase.execute({ refreshToken: RAW_REFRESH_TOKEN });

    expect(mockRefreshTokenRepository.revokeByTokenHash).toHaveBeenCalledWith(
      expectedHash,
    );
  });

  it('should not throw if token does not exist', async () => {
    mockRefreshTokenRepository.revokeByTokenHash.mockResolvedValue(undefined);

    await expect(
      useCase.execute({ refreshToken: RAW_REFRESH_TOKEN }),
    ).resolves.toBeUndefined();
  });
});
