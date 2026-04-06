export interface IResetPasswordUseCaseInput {
  token: string;
  newPassword: string;
}

export type IResetPasswordUseCaseOutput = void;
