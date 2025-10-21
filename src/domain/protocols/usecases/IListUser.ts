import { User } from '@/domain/entities'
import { TFilter, TUser } from '@/domain/protocols'

export interface IListUser {
  execute: (filter?: TFilter<TUser.Model>, sortBy?: string, order?: 'asc' | 'desc') => Promise<User[]>
}
