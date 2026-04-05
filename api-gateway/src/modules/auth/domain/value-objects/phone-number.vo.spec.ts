import { describe, it, expect } from 'vitest';
import { PhoneNumber } from './phone-number.vo';

describe('PhoneNumber VO', () => {
  it('should create a valid phone number with country code', () => {
    const phone = new PhoneNumber('+5511999998888');
    expect(phone.value).toBe('+5511999998888');
  });

  it('should accept various valid Brazilian phone formats', () => {
    const validPhones = [
      '+5511999998888',
      '5511999998888',
      '11999998888',
      '(11)999998888',
      '(11) 99999-8888',
      '+55 (11) 99999-8888',
    ];

    for (const num of validPhones) {
      expect(new PhoneNumber(num).value).toBe(num);
    }
  });

  it('should reject an invalid phone number', () => {
    expect(() => new PhoneNumber('123')).toThrow(
      'Invalid Brazilian phone number format',
    );
  });

  it('should reject an empty string', () => {
    expect(() => new PhoneNumber('')).toThrow();
  });

  it('should reject non-Brazilian format', () => {
    expect(() => new PhoneNumber('+1-555-555-5555')).toThrow();
  });

  it('should compare two equal phone numbers', () => {
    const phone1 = new PhoneNumber('+5511999998888');
    const phone2 = new PhoneNumber('+5511999998888');
    expect(phone1.equals(phone2)).toBe(true);
  });

  it('should compare two different phone numbers', () => {
    const phone1 = new PhoneNumber('+5511999998888');
    const phone2 = new PhoneNumber('+5521999997777');
    expect(phone1.equals(phone2)).toBe(false);
  });

  it('should return string representation', () => {
    const phone = new PhoneNumber('+5511999998888');
    expect(phone.toString()).toBe('+5511999998888');
  });
});
