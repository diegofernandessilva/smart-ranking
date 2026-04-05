import { BaseEntity } from '~/common/base-entity';
import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';
import { PhoneNumber } from '../value-objects/phone-number.vo';
import { UserRole } from '../enums/user-role.enum';
import { IUserProps } from './user.interface';

export class UserEntity extends BaseEntity {
  private _email: Email;
  private _password: Password;
  private _name: string;
  private _phoneNumber: PhoneNumber;
  private _role: UserRole;
  private _isActive: boolean;
  private _failedLoginAttempts: number;
  private _lockedUntil?: Date;
  private _passwordResetToken?: string;
  private _passwordResetExpires?: Date;
  private _lastPasswordChange?: Date;

  constructor(
    id: string,
    props: IUserProps,
    createdAt: Date,
    updatedAt: Date,
    deletedAt: Date | null = null,
  ) {
    super(id, createdAt, updatedAt, deletedAt);
    this._email = props.email;
    this._password = props.password;
    this._name = props.name;
    this._phoneNumber = props.phoneNumber;
    this._role = props.role;
    this._isActive = props.isActive;
    this._failedLoginAttempts = props.failedLoginAttempts;
    this._lockedUntil = props.lockedUntil;
    this._passwordResetToken = props.passwordResetToken;
    this._passwordResetExpires = props.passwordResetExpires;
    this._lastPasswordChange = props.lastPasswordChange;
  }

  get email(): Email {
    return this._email;
  }

  get password(): Password {
    return this._password;
  }

  get name(): string {
    return this._name;
  }

  get phoneNumber(): PhoneNumber {
    return this._phoneNumber;
  }

  get role(): UserRole {
    return this._role;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get failedLoginAttempts(): number {
    return this._failedLoginAttempts;
  }

  get lockedUntil(): Date | undefined {
    return this._lockedUntil;
  }

  get passwordResetToken(): string | undefined {
    return this._passwordResetToken;
  }

  get passwordResetExpires(): Date | undefined {
    return this._passwordResetExpires;
  }

  get lastPasswordChange(): Date | undefined {
    return this._lastPasswordChange;
  }

  incrementFailedLoginAttempts(): void {
    this._failedLoginAttempts += 1;
  }

  resetFailedLoginAttempts(): void {
    this._failedLoginAttempts = 0;
    this._lockedUntil = undefined;
  }

  lock(durationMs: number): void {
    this._lockedUntil = new Date(Date.now() + durationMs);
  }

  isLocked(): boolean {
    if (!this._lockedUntil) return false;
    return this._lockedUntil > new Date();
  }

  static create(
    id: string,
    props: Omit<
      IUserProps,
      'isActive' | 'failedLoginAttempts' | 'role'
    > &
      Partial<Pick<IUserProps, 'isActive' | 'failedLoginAttempts' | 'role'>>,
  ): UserEntity {
    const now = new Date();
    return new UserEntity(
      id,
      {
        ...props,
        role: props.role ?? UserRole.PLAYER,
        isActive: props.isActive ?? true,
        failedLoginAttempts: props.failedLoginAttempts ?? 0,
      },
      now,
      now,
    );
  }
}
