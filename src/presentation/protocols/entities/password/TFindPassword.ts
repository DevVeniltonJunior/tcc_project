import { TPassword } from '@/domain/protocols'

export namespace TGetPassword {
  export namespace Request {
    export type params = object
    export type body = object
    export type query = Partial<TPassword.Model>
  }
  export type Response = any
}
