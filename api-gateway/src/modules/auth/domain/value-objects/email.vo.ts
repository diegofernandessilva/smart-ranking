import { z } from 'zod';

const emailSchema = z.string().email('Invalid email format');

export class Email {
  private readonly _value: string;

  constructor(value: string) {
    const result = emailSchema.safeParse(value);
    if (!result.success) {
      throw new Error(result.error.issues[0].message);
    }
    this._value = result.data;
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
