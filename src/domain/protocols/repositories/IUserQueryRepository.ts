import { User } from '@/domain/entities/'
import { UserDTO } from '@/domain/dtos'
import { Id } from '@/domain/valueObjects'

export interface IUserQueryRepository {
  get: (id: Id) => Promise<User>
  find: (filters: Partial<User>) => Promise<User>
  list: (filters?: Partial<User>) => Promise<User[]>
}
