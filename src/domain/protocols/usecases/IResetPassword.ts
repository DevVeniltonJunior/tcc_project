import { Password } from '@/domain/entities'

export interface IResetPassword {
  execute: (old_password: Password, new_password: Password) => Promise<Password>
}