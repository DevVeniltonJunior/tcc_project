export interface Response<D> {
  readonly statusCode: number
  readonly data: D
 }