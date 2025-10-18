import { TBill } from '@/domain/protocols'

export namespace TUpdateBill {
  export namespace Request {
    export type params = object
    export type body = TBill.DTO
    export type query = object
    }
  export type Response = any
}