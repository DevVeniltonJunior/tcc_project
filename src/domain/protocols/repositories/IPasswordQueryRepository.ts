import { Password } from '@/domain/entities/'
import { Id } from '@/domain/valueObjects'

export interface IPasswordQueryRepository {
  get: (id: Id) => Promise<Password>
  find: (filters: Partial<Password>) => Promise<Password>
  list: (filters?: Partial<Password>) => Promise<Password[]>
}
