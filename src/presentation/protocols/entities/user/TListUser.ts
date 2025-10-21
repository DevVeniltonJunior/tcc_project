import { TUser } from '@/domain/protocols'

export namespace TListUser {
  export namespace Request {
    export type params = object
    export type body = object
    export type query = Partial<TUser.Model> & {
      sortBy?: string
      order?: 'asc' | 'desc'
    }
  }
  export type Response = any
}
