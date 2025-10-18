import { User } from '@/domain/entities'

export interface ICreateUser {
  execute: (entity: User) => Promise<User>
}