import { BaseEntity } from '~/common/base-entity';
import { IRefreshTokenProps } from './refresh-token.interface';

export class RefreshTokenEntity extends BaseEntity {
  private _userId: string;
  private _tokenHash: string;
  private _expiresAt: Date;
  private _isRevoked: boolean;
  private _replacedByHash?: string;

  constructor(
    id: string,
    props: IRefreshTokenProps,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null = null,
  ) {
    super(id, createdAt, updatedAt, deletedAt);
    this._userId = props.userId;
    this._tokenHash = props.tokenHash;
    this._expiresAt = props.expiresAt;
    this._isRevoked = props.isRevoked;
    this._replacedByHash = props.replacedByHash;
  }

  get userId(): string {
    return this._userId;
  }

  get tokenHash(): string {
    return this._tokenHash;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get isRevoked(): boolean {
    return this._isRevoked;
  }

  get replacedByHash(): string | undefined {
    return this._replacedByHash;
  }

  isExpired(): boolean {
    return this._expiresAt < new Date();
  }

  revoke(): void {
    this._isRevoked = true;
  }

  replaceWith(newTokenHash: string): void {
    this._isRevoked = true;
    this._replacedByHash = newTokenHash;
  }

  static create(
    id: string,
    props: Omit<IRefreshTokenProps, 'isRevoked'> &
      Partial<Pick<IRefreshTokenProps, 'isRevoked'>>,
  ): RefreshTokenEntity {
    const now = new Date();
    return new RefreshTokenEntity(
      id,
      {
        ...props,
        isRevoked: props.isRevoked ?? false,
      },
      now,
      now,
    );
  }
}
