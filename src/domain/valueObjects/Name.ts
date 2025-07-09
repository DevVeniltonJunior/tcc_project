import { InvalidParam } from "@/domain/exceptions"

export class Name {
  constructor(private readonly value: string) {
    if(!this.value || !this.isValid(this.value)) throw new InvalidParam(`${value} is invalid`)
  }

  private isValid(value: string): boolean {
    if (value.length > 2 && value.length < 156) {
      return true
    }
    return false
  }

  public toString(): string {
    return this.value
  }
}