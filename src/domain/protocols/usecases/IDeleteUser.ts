import { Id } from '@/domain/valueObjects'

export interface IDeleteUser {
  execute: (id: Id) => Promise<void>
}