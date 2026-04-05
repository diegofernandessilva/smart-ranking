export interface IRefreshTokenProps {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  isRevoked: boolean;
  replacedByHash?: string;
}

export interface IRefreshTokenPersistentData {
  _id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  isRevoked: boolean;
  replacedByHash?: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
