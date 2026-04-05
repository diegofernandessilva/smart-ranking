import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';
import { PhoneNumber } from '../value-objects/phone-number.vo';
import { UserRole } from '../enums/user-role.enum';

export interface IUserProps {
  email: Email;
  password: Password;
  name: string;
  phoneNumber: PhoneNumber;
  role: UserRole;
  isActive: boolean;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastPasswordChange?: Date;
}

export interface IUserPersistentData {
  _id: string;
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastPasswordChange?: Date;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDto {
  id: string;
  email: string;
  name: string;
  phoneNumber: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}
