import { Description } from '@/domain/valueObjects';
import { InvalidParam } from '@/domain/exceptions';

describe('[ValueObjects] Description', () => {
  it('should create a valid Description', () => {
    const input = 'This is a valid description.';
    const valueObject = new Description(input);
    expect(valueObject.toString()).toBe(input);
  })

  it('should throw InvalidParam for an empty Description', () => {
    expect(() => new Description('')).toThrow(InvalidParam);
  });

  it('should throw InvalidParam for a Description longer than 3000 characters', () => {
    const longDescription = 'a'.repeat(3001);
    expect(() => new Description(longDescription)).toThrow(InvalidParam);
  });
})