import { describe, it, expect } from 'vitest';
import { AuthPresenter } from './auth.presenter';
import { IUserDto } from '~/modules/auth/domain/entities/user.interface';

const mockUserDto: IUserDto = {
  id: '507f1f77bcf86cd799439011',
  email: 'john@example.com',
  name: 'John Doe',
  phoneNumber: '+5511999998888',
  role: 'PLAYER',
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('AuthPresenter', () => {
  describe('toRegisterResponse', () => {
    it('should return user with id, name, email, role', () => {
      const result = AuthPresenter.toRegisterResponse(mockUserDto);

      expect(result).toEqual({
        user: {
          id: mockUserDto.id,
          name: mockUserDto.name,
          email: mockUserDto.email,
          role: mockUserDto.role,
        },
      });
    });

    it('should NOT include sensitive fields like phoneNumber, isActive, createdAt', () => {
      const result = AuthPresenter.toRegisterResponse(mockUserDto);

      expect(result.user).not.toHaveProperty('phoneNumber');
      expect(result.user).not.toHaveProperty('isActive');
      expect(result.user).not.toHaveProperty('createdAt');
    });
  });

  describe('toLoginResponse', () => {
    it('should return accessToken and user', () => {
      const accessToken = 'jwt.access.token';
      const result = AuthPresenter.toLoginResponse(accessToken, mockUserDto);

      expect(result).toEqual({
        accessToken,
        user: {
          id: mockUserDto.id,
          name: mockUserDto.name,
          email: mockUserDto.email,
          role: mockUserDto.role,
        },
      });
    });
  });

  describe('toRefreshResponse', () => {
    it('should return only accessToken', () => {
      const result = AuthPresenter.toRefreshResponse('new.jwt.token');

      expect(result).toEqual({ accessToken: 'new.jwt.token' });
    });
  });

  describe('toLogoutResponse', () => {
    it('should return success message', () => {
      const result = AuthPresenter.toLogoutResponse();

      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('toChangePasswordResponse', () => {
    it('should return success message', () => {
      const result = AuthPresenter.toChangePasswordResponse();

      expect(result).toEqual({
        message: 'Password changed successfully',
      });
    });
  });

  describe('toForgotPasswordResponse', () => {
    it('should return generic message (no email enumeration)', () => {
      const result = AuthPresenter.toForgotPasswordResponse();

      expect(result).toEqual({
        message: 'If this email exists, a reset link has been sent',
      });
    });
  });

  describe('toResetPasswordResponse', () => {
    it('should return success message', () => {
      const result = AuthPresenter.toResetPasswordResponse();

      expect(result).toEqual({
        message: 'Password reset successfully',
      });
    });
  });

  describe('toMeResponse', () => {
    it('should return full user profile (including phoneNumber and createdAt)', () => {
      const result = AuthPresenter.toMeResponse(mockUserDto);

      expect(result).toEqual({
        id: mockUserDto.id,
        name: mockUserDto.name,
        email: mockUserDto.email,
        phoneNumber: mockUserDto.phoneNumber,
        role: mockUserDto.role,
        createdAt: mockUserDto.createdAt,
      });
    });

    it('should NOT include isActive field', () => {
      const result = AuthPresenter.toMeResponse(mockUserDto);

      expect(result).not.toHaveProperty('isActive');
    });
  });
});
