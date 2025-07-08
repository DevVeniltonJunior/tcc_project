import { InvalidParam } from "@/domain/exceptions"

export class Email {
  constructor(private readonly value: string) {
    if(!this.value || !this.isValid(this.value)) throw new InvalidParam(`${value} is invalid`)
  }

  private isValid(value: string): boolean {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return regex.test(value)
  }

  public toString(): string {
    return this.value
  }
}