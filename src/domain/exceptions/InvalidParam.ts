export class InvalidParam extends Error {
  constructor(param: string) {
    super(param)
    this.name = `Parameter invalid: ${param}`
  }
}