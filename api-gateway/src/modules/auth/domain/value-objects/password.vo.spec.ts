import { describe, it, expect } from 'vitest';
import { Password } from './password.vo';

describe('Password VO', () => {
  it('should create a valid password', () => {
    const password = new Password('Str0ng!Pass');
    expect(password.value).toBe('Str0ng!Pass');
  });

  it('should reject password shorter than 8 characters', () => {
    expect(() => new Password('Ab1!xyz')).toThrow(
      'Password must be at least 8 characters',
    );
  });

  it('should reject password without uppercase letter', () => {
    expect(() => new Password('str0ng!pass')).toThrow(
      'Password must contain at least one uppercase letter',
    );
  });

  it('should reject password without lowercase letter', () => {
    expect(() => new Password('STR0NG!PASS')).toThrow(
      'Password must contain at least one lowercase letter',
    );
  });

  it('should reject password without digit', () => {
    expect(() => new Password('Strong!Pass')).toThrow(
      'Password must contain at least one digit',
    );
  });

  it('should reject password without special character', () => {
    expect(() => new Password('Str0ngPass1')).toThrow(
      'Password must contain at least one special character',
    );
  });

  it('should accept all allowed special characters', () => {
    const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*'];

    for (const char of specialChars) {
      const pwd = `Str0ng${char}x`;
      expect(new Password(pwd).value).toBe(pwd);
    }
  });

  it('should reject an empty string', () => {
    expect(() => new Password('')).toThrow();
  });

  it('should return string representation', () => {
    const password = new Password('Str0ng!Pass');
    expect(password.toString()).toBe('Str0ng!Pass');
  });
});
