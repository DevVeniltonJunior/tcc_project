import { InstallmentsNumber } from '@/domain/valueObjects';
import { InvalidParam } from '@/domain/exceptions';

describe('[ValueObjects] InstallmentsNumber', () => {
  it('should create a valid InstallmentsNumber', () => {
    const input = 4;
    const valueObject = new InstallmentsNumber(input);
    expect(valueObject.toNumber()).toBe(input);
  })

  it('should throw InvalidParam for an float value', () => {
    const input = 4.5;
    expect(() => new InstallmentsNumber(input)).toThrow(InvalidParam);
  });
})