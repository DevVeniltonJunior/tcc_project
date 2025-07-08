import { InvalidParam } from '../exceptions';

export class Id {
  constructor(private readonly value: string) {
    if (!value || !this.isValid(value)) {
      throw new InvalidParam(`${value} is invalid`);
    }
  }

  private isValid(value: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    return uuidRegex.test(value);
  }

  public toString(): string {
    return this.value;
  }

  public equals(other: Id): boolean {
    return this.value === other.toString();
  }
}
