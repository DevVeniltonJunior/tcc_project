import { Password } from '@/domain/entities/'
import { Id } from '@/domain/valueObjects'
import { TFilter, TPassword } from '@/domain/protocols'

export interface IPasswordQueryRepository {
  get: (id: Id) => Promise<Password>
  find: (filters?: TFilter<TPassword.Model>) => Promise<Password>
  list: (filters?: TFilter<TPassword.Model>) => Promise<Password[]>
}
