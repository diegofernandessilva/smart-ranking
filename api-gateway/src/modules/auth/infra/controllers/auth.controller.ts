import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { Public } from '~/core/decorators/public.decorator';
import {
  CurrentUser,
  IJwtPayload,
} from '~/core/decorators/current-user.decorator';
import { RegisterUseCase } from '~/modules/auth/application/use-cases/register/register.use-case';
import { LoginUseCase } from '~/modules/auth/application/use-cases/login/login.use-case';
import { RefreshUseCase } from '~/modules/auth/application/use-cases/refresh/refresh.use-case';
import { LogoutUseCase } from '~/modules/auth/application/use-cases/logout/logout.use-case';
import { ChangePasswordUseCase } from '~/modules/auth/application/use-cases/change-password/change-password.use-case';
import { ForgotPasswordUseCase } from '~/modules/auth/application/use-cases/forgot-password/forgot-password.use-case';
import { ResetPasswordUseCase } from '~/modules/auth/application/use-cases/reset-password/reset-password.use-case';
import { GetMeUseCase } from '~/modules/auth/application/use-cases/get-me/get-me.use-case';
import { AuthPresenter } from '~/modules/auth/infra/presenters/auth.presenter';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';

const REFRESH_TOKEN_COOKIE = 'refreshToken';
const REFRESH_TOKEN_PATH = '/api/v1/auth';
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly getMeUseCase: GetMeUseCase,
  ) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    const result = await this.registerUseCase.execute({
      name: dto.name,
      email: dto.email,
      password: dto.password,
      phoneNumber: dto.phoneNumber,
    });
    return AuthPresenter.toRegisterResponse(result.user);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.loginUseCase.execute({
      email: dto.email,
      password: dto.password,
    });

    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: REFRESH_TOKEN_PATH,
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });

    return AuthPresenter.toLoginResponse(result.accessToken, result.user);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as
      | string
      | undefined;

    if (!refreshToken) {
      return AuthPresenter.toRefreshResponse('');
    }

    const result = await this.refreshUseCase.execute({ refreshToken });

    res.cookie(REFRESH_TOKEN_COOKIE, result.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: REFRESH_TOKEN_PATH,
      maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    });

    return AuthPresenter.toRefreshResponse(result.accessToken);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as
      | string
      | undefined;

    if (refreshToken) {
      await this.logoutUseCase.execute({ refreshToken });
    }

    res.clearCookie(REFRESH_TOKEN_COOKIE, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: REFRESH_TOKEN_PATH,
    });

    return AuthPresenter.toLogoutResponse();
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: IJwtPayload,
  ) {
    await this.changePasswordUseCase.execute({
      userId: user.sub,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
    });
    return AuthPresenter.toChangePasswordResponse();
  }

  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.forgotPasswordUseCase.execute({
      email: dto.email,
    });
    return AuthPresenter.toForgotPasswordResponse();
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.resetPasswordUseCase.execute({
      token: dto.token,
      newPassword: dto.newPassword,
    });
    return AuthPresenter.toResetPasswordResponse();
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('me')
  async me(@CurrentUser() user: IJwtPayload) {
    const result = await this.getMeUseCase.execute({
      userId: user.sub,
    });
    return AuthPresenter.toMeResponse(result.user);
  }
}
