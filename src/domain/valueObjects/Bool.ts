import { InvalidParam } from "@/domain/exceptions";

export class Bool {
  private readonly value: boolean;

  constructor(input: boolean | number) {
    if (input === null || input === undefined) {
      throw new InvalidParam(`Invalid value: ${input}`);
    }

    if (typeof input !== 'boolean' && typeof input !== 'number') {
      throw new InvalidParam(`Invalid type: ${typeof input}. Expected boolean or number.`);
    }

    if (typeof input === 'number' && input !== 0 && input !== 1) {
      throw new InvalidParam(`Invalid number: ${input}. Expected 0 or 1.`);
    }

    this.value = Boolean(input);
  }

  public toBoolean(): boolean {
    return this.value;
  }

  public toggle(): Bool {
    return new Bool(!this.value);
  }
}
