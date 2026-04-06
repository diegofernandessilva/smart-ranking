import { IUserDto } from '~/modules/auth/domain/entities/user.interface';

export interface IGetMeUseCaseInput {
  userId: string;
}

export interface IGetMeUseCaseOutput {
  user: IUserDto;
}
