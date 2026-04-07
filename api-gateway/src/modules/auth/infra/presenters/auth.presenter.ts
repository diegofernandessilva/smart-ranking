import { IUserDto } from '~/modules/auth/domain/entities/user.interface';

export class AuthPresenter {
  static toRegisterResponse(user: IUserDto) {
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  static toLoginResponse(accessToken: string, user: IUserDto) {
    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  static toRefreshResponse(accessToken: string) {
    return {
      accessToken,
    };
  }

  static toLogoutResponse() {
    return {
      message: 'Logged out successfully',
    };
  }

  static toChangePasswordResponse() {
    return {
      message: 'Password changed successfully',
    };
  }

  static toForgotPasswordResponse() {
    return {
      message: 'If this email exists, a reset link has been sent',
    };
  }

  static toResetPasswordResponse() {
    return {
      message: 'Password reset successfully',
    };
  }

  static toMeResponse(user: IUserDto) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
