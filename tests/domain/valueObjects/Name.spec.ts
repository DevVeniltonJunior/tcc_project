import { Name } from '@/domain/valueObjects';
import { InvalidParam } from '@/domain/exceptions';

describe('[ValueObjects] Name', () => {
  it('should create a valid Name', () => {
    const input = 'This is a valid Name.';
    const valueObject = new Name(input);
    expect(valueObject.toString()).toBe(input);
  })

  it('should throw InvalidParam for an empty Name', () => {
    expect(() => new Name('')).toThrow(InvalidParam);
  });

  it('should throw InvalidParam for a Name longer than 3000 characters', () => {
    const longName = 'a'.repeat(3001);
    expect(() => new Name(longName)).toThrow(InvalidParam);
  });
})