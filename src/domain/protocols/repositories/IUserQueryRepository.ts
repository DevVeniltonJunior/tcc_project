import { User } from '@/domain/entities/'
import { TFilter, TUser } from '@/domain/protocols'
import { Id } from '@/domain/valueObjects'

export interface IUserQueryRepository {
  get: (id: Id) => Promise<User | null>
  find: (filters?: TFilter<TUser.Model>) => Promise<User | null>
  list: (filters?: TFilter<TUser.Model>) => Promise<User[]>
}
