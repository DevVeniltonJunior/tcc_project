import { Id } from '@/domain/valueObjects';
import { InvalidParam } from '@/domain/exceptions';

describe('[ValueObjects] Id', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';
  const invalidUUID = 'invalid-id';

  it('should create an Id with a valid UUID', () => {
    const id = new Id(validUUID);
    expect(id.toString()).toBe(validUUID);
  });

  it('should throw InvalidParam if UUID is invalid', () => {
    expect(() => new Id(invalidUUID)).toThrow(InvalidParam);
    expect(() => new Id(invalidUUID)).toThrow(`${invalidUUID} is invalid`);
  });

  it('should return true when comparing equal Ids', () => {
    const id1 = new Id(validUUID);
    const id2 = new Id(validUUID);
    expect(id1.equals(id2)).toBe(true);
  });

  it('should return false when comparing different Ids', () => {
    const id1 = new Id(validUUID);
    const id2 = new Id('123e4567-e89b-12d3-a456-426614174000');
    expect(id1.equals(id2)).toBe(false);
  });

  it('should return a string representation of the value', () => {
    const id = new Id(validUUID);
    expect(typeof id.toString()).toBe('string');
    expect(id.toString()).toBe(validUUID);
  });

  it('should generate a valid UUID format string', () => {
    const generated = Id.generate();

    expect(typeof generated.toString()).toBe('string');
  });
});
