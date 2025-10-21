import { TPlanning, TPagination } from '@/domain/protocols'

export namespace TListPlanning {
  export namespace Request {
    export type params = object
    export type body = object
    export type query = Partial<TPlanning.Model> & TPagination.Request
  }
  export type Response = any
}
