import { InvalidParam } from "@/domain/exceptions"

export class MoneyValue {
  private readonly value: number
  constructor(input: number) {
    if(!input || !this.isValid(input)) throw new InvalidParam(`${input} is invalid`)
    
    this.value = parseFloat(input.toFixed(2))
  }

  private isValid(value: number): boolean {
    if (typeof value !== 'number' || value < 0) {
      return false
    }
    return true
  }

  public toNumber(): number {
    return parseFloat(this.value.toString())
  }
}