import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one digit')
  .regex(
    /[!@#$%^&*]/,
    'Password must contain at least one special character (!@#$%^&*)',
  );

export class Password {
  private readonly _value: string;

  constructor(value: string) {
    const result = passwordSchema.safeParse(value);
    if (!result.success) {
      throw new Error(result.error.issues[0].message);
    }
    this._value = result.data;
  }

  get value(): string {
    return this._value;
  }

  toString(): string {
    return this._value;
  }
}
