import { User } from '@/domain/entities/'
import { UserDTO } from '@/domain/dtos'
import { Id } from '@/domain/valueObjects'

export interface IUserCommandRepository {
  create: (entity: User) => Promise<User>
  update: (dto: UserDTO) => Promise<void>
  softDelete: (id: Id) => Promise<void>
  hardDelete: (id: Id) => Promise<void>
}