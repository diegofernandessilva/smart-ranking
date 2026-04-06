import { IUserDto } from '~/modules/auth/domain/entities/user.interface';

export interface IRegisterUseCaseInput {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
}

export interface IRegisterUseCaseOutput {
  user: IUserDto;
}
