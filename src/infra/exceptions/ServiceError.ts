export class ServiceException extends Error {
  constructor(param: string) {
    super(param)
    this.name = `Service exception`
  }
}