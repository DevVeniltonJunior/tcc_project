import { PasswordHash } from '@/domain/valueObjects';
import { InvalidParam } from '@/domain/exceptions';

describe('[ValueObjects] PasswordHash', () => {
  it('should create a valid PasswordHash', () => {
    const input = 'This is a valid PasswordHash.';
    const valueObject = new PasswordHash(input);
    expect(valueObject.toString()).toBe(input);
  })

  it('should throw InvalidParam for an empty PasswordHash', () => {
    expect(() => new PasswordHash('')).toThrow(InvalidParam);
  });
})