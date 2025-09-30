import { TPassword } from '@/domain/protocols'

export namespace TCreatePassword {
  export namespace Request {
    export type params = object
    export type body = TPassword.Entity
    export type query = object
    }
  export type Response = any
}
