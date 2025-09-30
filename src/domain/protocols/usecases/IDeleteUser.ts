import { Bool, Id } from '@/domain/valueObjects'

export interface IDeleteUser {
  execute: (id: Id, isPermanent: Bool) => Promise<void>
}