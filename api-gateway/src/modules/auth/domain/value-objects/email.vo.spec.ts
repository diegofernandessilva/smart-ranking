import { describe, it, expect } from 'vitest';
import { Email } from './email.vo';

describe('Email VO', () => {
  it('should create a valid email', () => {
    const email = new Email('user@example.com');
    expect(email.value).toBe('user@example.com');
  });

  it('should accept various valid email formats', () => {
    const validEmails = [
      'test@domain.com',
      'user.name@domain.com',
      'user+tag@domain.com',
      'user@subdomain.domain.com',
    ];

    for (const addr of validEmails) {
      expect(new Email(addr).value).toBe(addr);
    }
  });

  it('should reject an invalid email', () => {
    expect(() => new Email('not-an-email')).toThrow('Invalid email format');
  });

  it('should reject an empty string', () => {
    expect(() => new Email('')).toThrow();
  });

  it('should reject email without domain', () => {
    expect(() => new Email('user@')).toThrow();
  });

  it('should compare two equal emails', () => {
    const email1 = new Email('user@example.com');
    const email2 = new Email('user@example.com');
    expect(email1.equals(email2)).toBe(true);
  });

  it('should compare two different emails', () => {
    const email1 = new Email('user1@example.com');
    const email2 = new Email('user2@example.com');
    expect(email1.equals(email2)).toBe(false);
  });

  it('should return string representation', () => {
    const email = new Email('user@example.com');
    expect(email.toString()).toBe('user@example.com');
  });
});
