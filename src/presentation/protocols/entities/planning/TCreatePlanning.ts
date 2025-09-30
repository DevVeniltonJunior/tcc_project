import { TPlanning } from '@/domain/protocols'

export namespace TCreatePlanning {
  export namespace Request {
    export type params = object
    export type body = TPlanning.Entity
    export type query = object
    }
  export type Response = any
}
