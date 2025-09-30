import { TBill } from '@/domain/protocols'

export namespace TCreateBill {
  export namespace Request {
    export type params = object
    export type body = TBill.Entity
    export type query = object
    }
  export type Response = any
}
