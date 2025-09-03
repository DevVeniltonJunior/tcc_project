import { User } from '@/domain/entities'
import { TFilter, TUser } from '@/domain/protocols'

export interface IFindUser {
  execute: (filter?: TFilter<TUser.Model>) => Promise<User>
}
