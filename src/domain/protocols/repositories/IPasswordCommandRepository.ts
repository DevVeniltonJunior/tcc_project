import { Password } from '@/domain/entities/'
import { Id } from '@/domain/valueObjects'

export interface IPasswordCommandRepository {
  create: (entity: Password) => Promise<Password>
  deactivate: (id: Id) => Promise<void>
}