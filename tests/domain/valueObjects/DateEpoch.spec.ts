import { DateEpoch } from '@/domain/valueObjects';
import { InvalidParam } from '@/domain/exceptions';

describe('[ValueObjects] DateEpoch', () => {
  const validInput = [1752070932575, 1633036800000, 1672531199000]; // Valid epoch timestamps
  const invalidInput = [-1, 'invalid', null, undefined]; // Invalid inputs

  validInput.forEach((epoch) => {
    it(`should create a DateEpoch with a valid value ${epoch}`, () => {
      const valueObject = new DateEpoch(epoch);
      expect(valueObject.toNumber()).toBe(epoch);
    });
  });

  invalidInput.forEach((epoch) => {
    it(`should throw an error with an invalid value ${epoch}`, () => {
      expect(() => new DateEpoch(epoch as string)).toThrow(InvalidParam);
      expect(() => new DateEpoch(epoch as string)).toThrow(`${epoch} is invalid`);
    });
  });
})