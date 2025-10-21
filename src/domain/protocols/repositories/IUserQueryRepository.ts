import { User } from '@/domain/entities/'
import { TFilter, TUser } from '@/domain/protocols'
import { Email, Id } from '@/domain/valueObjects'

export interface IUserQueryRepository {
  get: (id: Id) => Promise<User>
  getByEmail: (email: Email) => Promise<User>
  find: (filters?: TFilter<TUser.Model>) => Promise<User>
  list: (filters?: TFilter<TUser.Model>, sortBy?: string, order?: 'asc' | 'desc') => Promise<User[]>
}
