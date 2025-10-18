import { Bool } from '@/domain/valueObjects';
import { InvalidParam } from '@/domain/exceptions';

describe('[ValueObjects] Bool', () => {
  const validInput = [true, false, 1, 0]; // Valid boolean values
  const invalidInput = [null, undefined, 3, 4, 'true', 'false']; // Invalid inputs

  validInput.forEach((value) => {
    it(`should create a Boolean with a valid value ${value}`, () => {
      const valueObject = new Bool(value);
      expect(valueObject.toBoolean()).toBe(Boolean(value));
    });
  });

  invalidInput.forEach((value) => {
    it(`should throw an error with an invalid value ${value}`, () => {
      expect(() => new Bool(value as any)).toThrow(InvalidParam);
    });
  });

  it('should toggle the boolean value', () => {
    const boolTrue = new Bool(true);
    const boolFalse = new Bool(false);
    expect(boolTrue.toggle().toBoolean()).toBe(false);
    expect(boolFalse.toggle().toBoolean()).toBe(true);
  });
})