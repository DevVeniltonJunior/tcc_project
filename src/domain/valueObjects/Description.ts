import { InvalidParam } from "@/domain/exceptions"

export class Description {
  constructor(private readonly value: string) {
    if(!this.value || !this.isValid(this.value)) throw new InvalidParam(`${value} is invalid`)
  }

  private isValid(value: string): boolean {
    if (value.length > 0 && value.length < 3000) {
      return true
    }
    return false
  }

  public toString(): string {
    return this.value
  }
}