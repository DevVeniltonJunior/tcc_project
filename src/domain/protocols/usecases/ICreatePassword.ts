import { Password } from '@/domain/entities'

export interface ICreatePassword {
  execute: (entity: Password) => Promise<Password>
}