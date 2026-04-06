export interface IRefreshUseCaseInput {
  refreshToken: string;
}

export interface IRefreshUseCaseOutput {
  accessToken: string;
  refreshToken: string;
}
