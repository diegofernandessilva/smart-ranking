import { IUserDto } from '~/modules/auth/domain/entities/user.interface';

export interface ILoginUseCaseInput {
  email: string;
  password: string;
}

export interface ILoginUseCaseOutput {
  accessToken: string;
  refreshToken: string;
  user: IUserDto;
}
