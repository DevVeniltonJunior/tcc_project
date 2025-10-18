import { TBill } from '@/domain/protocols'

export namespace TFindBill {
  export namespace Request {
    export type params = object
    export type body = object
    export type query = Partial<TBill.Model>
  }
  export type Response = any
}
