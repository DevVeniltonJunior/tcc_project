import { TPlanning } from '@/domain/protocols'

export namespace TUpdatePlanning {
  export namespace Request {
    export type params = object
    export type body = TPlanning.DTO
    export type query = object
    }
  export type Response = any
}