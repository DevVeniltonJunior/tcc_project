import { Password } from '@/domain/entities/'
import { Id } from '@/domain/valueObjects'

export interface IPasswordCommandRepository {
  create: (entity: Password) => Promise<Password>
  softDelete: (id: Id) => Promise<void>
  hardDelete: (id: Id) => Promise<void>
}