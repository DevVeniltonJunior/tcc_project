import { TUser } from '@/domain/protocols'

export namespace TCreateUser {
  export namespace Request {
    export type params = object
    export type body = Omit<TUser.Entity, "id" | "createdAt" | "updatedAt" | "deletedAt">

    export type query = object
    }
  export type Response = any
}
