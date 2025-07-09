import { InvalidParam } from "@/domain/exceptions"

export class Password {
  constructor(private readonly value: string) {
    if(!this.value) throw new InvalidParam(`${value} is invalid`)
  }

  public toString(): string {
    return this.value
  }
}