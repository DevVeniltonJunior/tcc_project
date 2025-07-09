import { Password } from '@/domain/valueObjects';
import { InvalidParam } from '@/domain/exceptions';

describe('[ValueObjects] Password', () => {
  it('should create a valid Password', () => {
    const input = 'This is a valid Password.';
    const valueObject = new Password(input);
    expect(valueObject.toString()).toBe(input);
  })

  it('should throw InvalidParam for an empty Password', () => {
    expect(() => new Password('')).toThrow(InvalidParam);
  });
})