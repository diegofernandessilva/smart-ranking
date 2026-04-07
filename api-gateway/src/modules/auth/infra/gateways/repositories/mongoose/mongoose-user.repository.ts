import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AbstractUserRepository } from '~/modules/auth/application/gateways/repositories/abstract-user.repository';
import { UserEntity } from '~/modules/auth/domain/entities/user.entity';
import { IUserProps } from '~/modules/auth/domain/entities/user.interface';
import { UserMapper } from '~/modules/auth/domain/mappers/user.mapper';
import {
  UserModel,
  UserDocument,
} from '~/modules/auth/infra/schemas/user.schema';

@Injectable()
export class MongooseUserRepository extends AbstractUserRepository {
  constructor(
    @InjectModel(UserModel.name)
    private readonly userModel: Model<UserDocument>,
  ) {
    super();
  }

  async create(user: UserEntity): Promise<UserEntity> {
    const data = UserMapper.toPersistentData(user);
    const doc = await this.userModel.create({
      _id: data._id,
      email: data.email,
      password: data.password,
      name: data.name,
      phoneNumber: data.phoneNumber,
      role: data.role,
      isActive: data.isActive,
      failedLoginAttempts: data.failedLoginAttempts,
      lockedUntil: data.lockedUntil,
      passwordResetToken: data.passwordResetToken,
      passwordResetExpires: data.passwordResetExpires,
      lastPasswordChange: data.lastPasswordChange,
      deletedAt: data.deletedAt,
    });
    return UserMapper.toEntity({
      _id: doc._id.toString(),
      email: doc.email,
      password: doc.password,
      name: doc.name,
      phoneNumber: doc.phoneNumber,
      role: doc.role,
      isActive: doc.isActive,
      failedLoginAttempts: doc.failedLoginAttempts,
      lockedUntil: doc.lockedUntil,
      passwordResetToken: doc.passwordResetToken,
      passwordResetExpires: doc.passwordResetExpires,
      lastPasswordChange: doc.lastPasswordChange,
      deletedAt: doc.deletedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const doc = await this.userModel
      .findOne({ email, deletedAt: null })
      .exec();
    if (!doc) return null;
    return UserMapper.toEntity({
      _id: doc._id.toString(),
      email: doc.email,
      password: doc.password,
      name: doc.name,
      phoneNumber: doc.phoneNumber,
      role: doc.role,
      isActive: doc.isActive,
      failedLoginAttempts: doc.failedLoginAttempts,
      lockedUntil: doc.lockedUntil,
      passwordResetToken: doc.passwordResetToken,
      passwordResetExpires: doc.passwordResetExpires,
      lastPasswordChange: doc.lastPasswordChange,
      deletedAt: doc.deletedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async findById(id: string): Promise<UserEntity | null> {
    const doc = await this.userModel
      .findOne({ _id: id, deletedAt: null })
      .exec();
    if (!doc) return null;
    return UserMapper.toEntity({
      _id: doc._id.toString(),
      email: doc.email,
      password: doc.password,
      name: doc.name,
      phoneNumber: doc.phoneNumber,
      role: doc.role,
      isActive: doc.isActive,
      failedLoginAttempts: doc.failedLoginAttempts,
      lockedUntil: doc.lockedUntil,
      passwordResetToken: doc.passwordResetToken,
      passwordResetExpires: doc.passwordResetExpires,
      lastPasswordChange: doc.lastPasswordChange,
      deletedAt: doc.deletedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async update(
    id: string,
    data: Partial<IUserProps>,
  ): Promise<UserEntity> {
    const updateData: Record<string, unknown> = {};

    if (data.email) updateData.email = data.email.value;
    if (data.password) updateData.password = data.password.value;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phoneNumber) updateData.phoneNumber = data.phoneNumber.value;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.failedLoginAttempts !== undefined)
      updateData.failedLoginAttempts = data.failedLoginAttempts;
    if (data.lockedUntil !== undefined)
      updateData.lockedUntil = data.lockedUntil;
    if (data.passwordResetToken !== undefined)
      updateData.passwordResetToken = data.passwordResetToken;
    if (data.passwordResetExpires !== undefined)
      updateData.passwordResetExpires = data.passwordResetExpires;
    if (data.lastPasswordChange !== undefined)
      updateData.lastPasswordChange = data.lastPasswordChange;

    const doc = await this.userModel
      .findOneAndUpdate({ _id: id, deletedAt: null }, updateData, {
        returnDocument: 'after',
      })
      .exec();

    if (!doc) {
      throw new Error(`User with id ${id} not found`);
    }

    return UserMapper.toEntity({
      _id: doc._id.toString(),
      email: doc.email,
      password: doc.password,
      name: doc.name,
      phoneNumber: doc.phoneNumber,
      role: doc.role,
      isActive: doc.isActive,
      failedLoginAttempts: doc.failedLoginAttempts,
      lockedUntil: doc.lockedUntil,
      passwordResetToken: doc.passwordResetToken,
      passwordResetExpires: doc.passwordResetExpires,
      lastPasswordChange: doc.lastPasswordChange,
      deletedAt: doc.deletedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async findByResetToken(tokenHash: string): Promise<UserEntity | null> {
    const doc = await this.userModel
      .findOne({
        passwordResetToken: tokenHash,
        deletedAt: null,
      })
      .exec();
    if (!doc) return null;
    return UserMapper.toEntity({
      _id: doc._id.toString(),
      email: doc.email,
      password: doc.password,
      name: doc.name,
      phoneNumber: doc.phoneNumber,
      role: doc.role,
      isActive: doc.isActive,
      failedLoginAttempts: doc.failedLoginAttempts,
      lockedUntil: doc.lockedUntil,
      passwordResetToken: doc.passwordResetToken,
      passwordResetExpires: doc.passwordResetExpires,
      lastPasswordChange: doc.lastPasswordChange,
      deletedAt: doc.deletedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.userModel
      .updateOne({ _id: id, deletedAt: null }, { deletedAt: new Date() })
      .exec();
  }
}
