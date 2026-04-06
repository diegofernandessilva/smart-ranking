import { describe, it, expect } from 'vitest';
import { MongooseIdGenerator } from './mongoose-id-generator';

describe('MongooseIdGenerator', () => {
  const generator = new MongooseIdGenerator();

  it('should generate a valid 24-character hex string', () => {
    const id = generator.generate();

    expect(id).toMatch(/^[a-f0-9]{24}$/);
  });

  it('should generate unique IDs on each call', () => {
    const id1 = generator.generate();
    const id2 = generator.generate();

    expect(id1).not.toBe(id2);
  });
});
