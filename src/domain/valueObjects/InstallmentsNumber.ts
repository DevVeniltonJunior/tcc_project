import { InvalidParam } from "@/domain/exceptions"

export class InstallmentsNumber {
  constructor(private readonly value: number) {
    if(!this.value || !Number.isInteger(value)) throw new InvalidParam(`${value} is invalid`)
  }

  public toNumber(): number {
    return this.value
  }
}