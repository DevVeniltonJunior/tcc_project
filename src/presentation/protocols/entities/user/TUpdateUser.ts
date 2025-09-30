import { TUser } from '@/domain/protocols'

export namespace TUpdateUser {
  export namespace Request {
    export type params = object
    export type body = Omit<TUser.DTO, "deletedAt" | "updatedAt">
    export type query = object
    }
  export type Response = any
}