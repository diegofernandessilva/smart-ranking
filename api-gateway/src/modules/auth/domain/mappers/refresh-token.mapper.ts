import { RefreshTokenEntity } from '../entities/refresh-token.entity';
import { IRefreshTokenPersistentData } from '../entities/refresh-token.interface';

export class RefreshTokenMapper {
  static toPersistentData(
    entity: RefreshTokenEntity,
  ): IRefreshTokenPersistentData {
    return {
      _id: entity.id,
      userId: entity.userId,
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt,
      isRevoked: entity.isRevoked,
      replacedByHash: entity.replacedByHash,
      deletedAt: entity.deletedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toEntity(data: IRefreshTokenPersistentData): RefreshTokenEntity {
    return new RefreshTokenEntity(
      data._id,
      {
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        isRevoked: data.isRevoked,
        replacedByHash: data.replacedByHash,
      },
      data.createdAt,
      data.updatedAt,
      data.deletedAt,
    );
  }
}
