import { TPlanning } from '@/domain/protocols'

export namespace TFindPlanning {
  export namespace Request {
    export type params = object
    export type body = object
    export type query = Partial<TPlanning.Model>
  }
  export type Response = any
}
