import { Plan } from '@/domain/valueObjects';
import { InvalidParam } from '@/domain/exceptions';

describe('[ValueObjects] Plan', () => {
  it('should create a valid Plan', () => {
    const input = 'This is a valid Plan.';
    const valueObject = new Plan(input);
    expect(valueObject.toString()).toBe(input);
  })

  it('should throw InvalidParam for an empty Plan', () => {
    expect(() => new Plan('')).toThrow(InvalidParam);
  });

  it('should throw InvalidParam for a Plan longer than 3000 characters', () => {
    const longPlan = 'a'.repeat(3001);
    expect(() => new Plan(longPlan)).toThrow(InvalidParam);
  });
})