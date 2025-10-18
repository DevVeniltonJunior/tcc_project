import { Goal } from '@/domain/valueObjects';
import { InvalidParam } from '@/domain/exceptions';

describe('[ValueObjects] Goal', () => {
  it('should create a valid Goal', () => {
    const input = 'This is a valid Goal.';
    const valueObject = new Goal(input);
    expect(valueObject.toString()).toBe(input);
  })

  it('should throw InvalidParam for an empty Goal', () => {
    expect(() => new Goal('')).toThrow(InvalidParam);
  });

  it('should throw InvalidParam for a Goal longer than 3000 characters', () => {
    const longGoal = 'a'.repeat(3001);
    expect(() => new Goal(longGoal)).toThrow(InvalidParam);
  });
})