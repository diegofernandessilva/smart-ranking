import { z } from 'zod';

const phoneNumberSchema = z
  .string()
  .regex(
    /^\+?(?:55)?\s?\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/,
    'Invalid Brazilian phone number format',
  );

export class PhoneNumber {
  private readonly _value: string;

  constructor(value: string) {
    const result = phoneNumberSchema.safeParse(value);
    if (!result.success) {
      throw new Error(result.error.issues[0].message);
    }
    this._value = result.data;
  }

  get value(): string {
    return this._value;
  }

  equals(other: PhoneNumber): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
