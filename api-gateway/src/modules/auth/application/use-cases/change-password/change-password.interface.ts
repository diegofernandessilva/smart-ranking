export interface IChangePasswordUseCaseInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export type IChangePasswordUseCaseOutput = void;
