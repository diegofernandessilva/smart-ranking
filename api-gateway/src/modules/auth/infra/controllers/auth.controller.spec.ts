import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { RegisterUseCase } from '~/modules/auth/application/use-cases/register/register.use-case';
import { LoginUseCase } from '~/modules/auth/application/use-cases/login/login.use-case';
import { RefreshUseCase } from '~/modules/auth/application/use-cases/refresh/refresh.use-case';
import { LogoutUseCase } from '~/modules/auth/application/use-cases/logout/logout.use-case';
import { ChangePasswordUseCase } from '~/modules/auth/application/use-cases/change-password/change-password.use-case';
import { ForgotPasswordUseCase } from '~/modules/auth/application/use-cases/forgot-password/forgot-password.use-case';
import { ResetPasswordUseCase } from '~/modules/auth/application/use-cases/reset-password/reset-password.use-case';
import { GetMeUseCase } from '~/modules/auth/application/use-cases/get-me/get-me.use-case';
import { IUserDto } from '~/modules/auth/domain/entities/user.interface';
import { Request, Response } from 'express';

const mockUserDto: IUserDto = {
  id: '507f1f77bcf86cd799439011',
  email: 'john@example.com',
  name: 'John Doe',
  phoneNumber: '+5511999998888',
  role: 'PLAYER',
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

function createMockResponse(): Response {
  return {
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  } as unknown as Response;
}

function createMockRequest(cookies: Record<string, string> = {}): Request {
  return { cookies } as unknown as Request;
}

describe('AuthController', () => {
  let controller: AuthController;
  let registerUseCase: { execute: ReturnType<typeof vi.fn> };
  let loginUseCase: { execute: ReturnType<typeof vi.fn> };
  let refreshUseCase: { execute: ReturnType<typeof vi.fn> };
  let logoutUseCase: { execute: ReturnType<typeof vi.fn> };
  let changePasswordUseCase: { execute: ReturnType<typeof vi.fn> };
  let forgotPasswordUseCase: { execute: ReturnType<typeof vi.fn> };
  let resetPasswordUseCase: { execute: ReturnType<typeof vi.fn> };
  let getMeUseCase: { execute: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    registerUseCase = { execute: vi.fn() };
    loginUseCase = { execute: vi.fn() };
    refreshUseCase = { execute: vi.fn() };
    logoutUseCase = { execute: vi.fn() };
    changePasswordUseCase = { execute: vi.fn() };
    forgotPasswordUseCase = { execute: vi.fn() };
    resetPasswordUseCase = { execute: vi.fn() };
    getMeUseCase = { execute: vi.fn() };

    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: RegisterUseCase, useValue: registerUseCase },
        { provide: LoginUseCase, useValue: loginUseCase },
        { provide: RefreshUseCase, useValue: refreshUseCase },
        { provide: LogoutUseCase, useValue: logoutUseCase },
        { provide: ChangePasswordUseCase, useValue: changePasswordUseCase },
        { provide: ForgotPasswordUseCase, useValue: forgotPasswordUseCase },
        { provide: ResetPasswordUseCase, useValue: resetPasswordUseCase },
        { provide: GetMeUseCase, useValue: getMeUseCase },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('should call RegisterUseCase with correct input and return presenter response', async () => {
      registerUseCase.execute.mockResolvedValue({ user: mockUserDto });

      const dto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Str0ng!Pass',
        phoneNumber: '+5511999998888',
      };

      const result = await controller.register(dto);

      expect(registerUseCase.execute).toHaveBeenCalledWith({
        name: dto.name,
        email: dto.email,
        password: dto.password,
        phoneNumber: dto.phoneNumber,
      });
      expect(result).toEqual({
        user: {
          id: mockUserDto.id,
          name: mockUserDto.name,
          email: mockUserDto.email,
          role: mockUserDto.role,
        },
      });
    });
  });

  describe('login', () => {
    it('should call LoginUseCase, set refresh token cookie, and return presenter response', async () => {
      const loginResult = {
        accessToken: 'jwt.access.token',
        refreshToken: 'raw-refresh-token',
        user: mockUserDto,
      };
      loginUseCase.execute.mockResolvedValue(loginResult);

      const dto = { email: 'john@example.com', password: 'Str0ng!Pass' };
      const res = createMockResponse();

      const result = await controller.login(dto, res);

      expect(loginUseCase.execute).toHaveBeenCalledWith({
        email: dto.email,
        password: dto.password,
      });
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'raw-refresh-token',
        {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          path: '/api/v1/auth',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        },
      );
      expect(result).toEqual({
        accessToken: 'jwt.access.token',
        user: {
          id: mockUserDto.id,
          name: mockUserDto.name,
          email: mockUserDto.email,
          role: mockUserDto.role,
        },
      });
    });
  });

  describe('refresh', () => {
    it('should call RefreshUseCase with token from cookie and set new cookie', async () => {
      const refreshResult = {
        accessToken: 'new.jwt.token',
        refreshToken: 'new-raw-refresh-token',
      };
      refreshUseCase.execute.mockResolvedValue(refreshResult);

      const req = createMockRequest({
        refreshToken: 'old-raw-refresh-token',
      });
      const res = createMockResponse();

      const result = await controller.refresh(req, res);

      expect(refreshUseCase.execute).toHaveBeenCalledWith({
        refreshToken: 'old-raw-refresh-token',
      });
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'new-raw-refresh-token',
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          path: '/api/v1/auth',
        }),
      );
      expect(result).toEqual({ accessToken: 'new.jwt.token' });
    });

    it('should return empty accessToken when no cookie present', async () => {
      const req = createMockRequest({});
      const res = createMockResponse();

      const result = await controller.refresh(req, res);

      expect(refreshUseCase.execute).not.toHaveBeenCalled();
      expect(result).toEqual({ accessToken: '' });
    });
  });

  describe('logout', () => {
    it('should call LogoutUseCase and clear cookie', async () => {
      logoutUseCase.execute.mockResolvedValue(undefined);

      const req = createMockRequest({
        refreshToken: 'some-refresh-token',
      });
      const res = createMockResponse();

      const result = await controller.logout(req, res);

      expect(logoutUseCase.execute).toHaveBeenCalledWith({
        refreshToken: 'some-refresh-token',
      });
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/api/v1/auth',
      });
      expect(result).toEqual({ message: 'Logged out successfully' });
    });

    it('should skip use case if no refresh token cookie but still clear cookie', async () => {
      const req = createMockRequest({});
      const res = createMockResponse();

      const result = await controller.logout(req, res);

      expect(logoutUseCase.execute).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('changePassword', () => {
    it('should call ChangePasswordUseCase with userId from JWT and DTO fields', async () => {
      changePasswordUseCase.execute.mockResolvedValue(undefined);

      const dto = {
        currentPassword: 'OldP@ss1',
        newPassword: 'NewP@ss2',
      };
      const jwtPayload = {
        sub: '507f1f77bcf86cd799439011',
        email: 'john@example.com',
        role: 'PLAYER',
      };

      const result = await controller.changePassword(dto, jwtPayload);

      expect(changePasswordUseCase.execute).toHaveBeenCalledWith({
        userId: jwtPayload.sub,
        currentPassword: dto.currentPassword,
        newPassword: dto.newPassword,
      });
      expect(result).toEqual({
        message: 'Password changed successfully',
      });
    });
  });

  describe('forgotPassword', () => {
    it('should call ForgotPasswordUseCase and return generic message', async () => {
      forgotPasswordUseCase.execute.mockResolvedValue(undefined);

      const dto = { email: 'john@example.com' };

      const result = await controller.forgotPassword(dto);

      expect(forgotPasswordUseCase.execute).toHaveBeenCalledWith({
        email: dto.email,
      });
      expect(result).toEqual({
        message: 'If this email exists, a reset link has been sent',
      });
    });
  });

  describe('resetPassword', () => {
    it('should call ResetPasswordUseCase with token and new password', async () => {
      resetPasswordUseCase.execute.mockResolvedValue(undefined);

      const dto = {
        token: 'reset-token-hex',
        newPassword: 'NewStr0ng!Pass',
      };

      const result = await controller.resetPassword(dto);

      expect(resetPasswordUseCase.execute).toHaveBeenCalledWith({
        token: dto.token,
        newPassword: dto.newPassword,
      });
      expect(result).toEqual({
        message: 'Password reset successfully',
      });
    });
  });

  describe('me', () => {
    it('should call GetMeUseCase with userId from JWT and return full profile', async () => {
      getMeUseCase.execute.mockResolvedValue({ user: mockUserDto });

      const jwtPayload = {
        sub: '507f1f77bcf86cd799439011',
        email: 'john@example.com',
        role: 'PLAYER',
      };

      const result = await controller.me(jwtPayload);

      expect(getMeUseCase.execute).toHaveBeenCalledWith({
        userId: jwtPayload.sub,
      });
      expect(result).toEqual({
        id: mockUserDto.id,
        name: mockUserDto.name,
        email: mockUserDto.email,
        phoneNumber: mockUserDto.phoneNumber,
        role: mockUserDto.role,
        createdAt: mockUserDto.createdAt,
      });
    });
  });
});
