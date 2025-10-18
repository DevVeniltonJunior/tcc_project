import { InvalidParam } from '@/domain/exceptions'

export class DateEpoch {
  private readonly epochValue: number
  private readonly dateValue: Date

  constructor (private readonly value: string | Date | number) {
    if (!value) throw new InvalidParam(`${value} is invalid`)
    if (typeof value === 'string' || value instanceof Date) value = this._toEpoch()
    if (!this._isValid(value)) throw new InvalidParam(`${value} is invalid`)

    this.epochValue = value
    this.dateValue = new Date(value)
  }

  private _toEpoch (): number {
    const epoch = new Date(this.value).getTime()
    if (typeof epoch !== 'number' || isNaN(epoch)) throw new InvalidParam(`${this.value} is invalid`)
    return epoch
  }

  private _isValid (value: number): boolean {
    if (value <= 0 || value > 999999999999999) return false
    return true
  }

  toNumber (): number {
    return this.epochValue
  }

  toDate (): Date {
    return this.dateValue
  }

  toISO (): string {
    return this.dateValue.toISOString()
  }
}