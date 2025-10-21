import { TBill, TPagination } from '@/domain/protocols'

export namespace TListBill {
  export namespace Request {
    export type params = object
    export type body = object
    export type query = Partial<TBill.Model> & TPagination.Request
  }
  export type Response = any
}
