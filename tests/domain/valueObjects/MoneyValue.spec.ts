import { MoneyValue } from '@/domain/valueObjects';
import { InvalidParam } from '@/domain/exceptions';

describe('[ValueObjects] MoneyValue', () => {
  it('should create a valid MoneyValue', () => {
    const input = 4.53;
    const valueObject = new MoneyValue(input);
    expect(valueObject.toNumber()).toBe(input);
  })

  it('should convert a interger value to float', () => {
    const input = 5;
    const valueObject = new MoneyValue(input);
    expect(valueObject.toNumber()).toBe(5.00);
  });

  it('should throw InvalidParam for a negative value', () => {
    const input = -1;
    expect(() => new MoneyValue(input)).toThrow(InvalidParam);
  });
})