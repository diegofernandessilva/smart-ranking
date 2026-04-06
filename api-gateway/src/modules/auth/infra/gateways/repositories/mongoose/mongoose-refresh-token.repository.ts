import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbstractRefreshTokenRepository } from '~/modules/auth/application/gateways/repositories/abstract-refresh-token.repository';
import { RefreshTokenEntity } from '~/modules/auth/domain/entities/refresh-token.entity';
import { RefreshTokenMapper } from '~/modules/auth/domain/mappers/refresh-token.mapper';
import {
  RefreshTokenModel,
  RefreshTokenDocument,
} from '~/modules/auth/infra/schemas/refresh-token.schema';

@Injectable()
export class MongooseRefreshTokenRepository extends AbstractRefreshTokenRepository {
  constructor(
    @InjectModel(RefreshTokenModel.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
  ) {
    super();
  }

  async create(token: RefreshTokenEntity): Promise<void> {
    const data = RefreshTokenMapper.toPersistentData(token);
    await this.refreshTokenModel.create({
      _id: data._id,
      userId: data.userId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt,
      isRevoked: data.isRevoked,
      replacedByHash: data.replacedByHash,
      deletedAt: data.deletedAt,
    });
  }

  async findByTokenHash(hash: string): Promise<RefreshTokenEntity | null> {
    const doc = await this.refreshTokenModel
      .findOne({ tokenHash: hash, deletedAt: null })
      .exec();
    if (!doc) return null;
    return RefreshTokenMapper.toEntity({
      _id: doc._id.toString(),
      userId: doc.userId.toString(),
      tokenHash: doc.tokenHash,
      expiresAt: doc.expiresAt,
      isRevoked: doc.isRevoked,
      replacedByHash: doc.replacedByHash,
      deletedAt: doc.deletedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async revokeByTokenHash(hash: string): Promise<void> {
    await this.refreshTokenModel
      .updateOne({ tokenHash: hash }, { isRevoked: true })
      .exec();
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.refreshTokenModel
      .updateMany(
        { userId, isRevoked: false, deletedAt: null },
        { isRevoked: true },
      )
      .exec();
  }
}
