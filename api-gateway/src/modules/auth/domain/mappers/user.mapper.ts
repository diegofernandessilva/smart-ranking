import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';
import { PhoneNumber } from '../value-objects/phone-number.vo';
import { UserRole } from '../enums/user-role.enum';
import { UserEntity } from '../entities/user.entity';
import {
  IUserPersistentData,
  IUserDto,
} from '../entities/user.interface';

export class UserMapper {
  static toPersistentData(entity: UserEntity): IUserPersistentData {
    return {
      _id: entity.id,
      email: entity.email.value,
      password: entity.password.value,
      name: entity.name,
      phoneNumber: entity.phoneNumber.value,
      role: entity.role,
      isActive: entity.isActive,
      failedLoginAttempts: entity.failedLoginAttempts,
      lockedUntil: entity.lockedUntil,
      passwordResetToken: entity.passwordResetToken,
      passwordResetExpires: entity.passwordResetExpires,
      lastPasswordChange: entity.lastPasswordChange,
      deletedAt: entity.deletedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toEntity(data: IUserPersistentData): UserEntity {
    return new UserEntity(
      data._id,
      {
        email: new Email(data.email),
        password: Password.fromHash(data.password),
        name: data.name,
        phoneNumber: new PhoneNumber(data.phoneNumber),
        role: data.role as UserRole,
        isActive: data.isActive,
        failedLoginAttempts: data.failedLoginAttempts,
        lockedUntil: data.lockedUntil,
        passwordResetToken: data.passwordResetToken,
        passwordResetExpires: data.passwordResetExpires,
        lastPasswordChange: data.lastPasswordChange,
      },
      data.createdAt,
      data.updatedAt,
      data.deletedAt,
    );
  }

  static toDto(entity: UserEntity): IUserDto {
    return {
      id: entity.id,
      email: entity.email.value,
      name: entity.name,
      phoneNumber: entity.phoneNumber.value,
      role: entity.role,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
    };
  }
}
