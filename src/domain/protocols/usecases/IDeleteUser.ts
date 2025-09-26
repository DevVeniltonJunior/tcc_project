import { Id } from '@/domain/valueObjects'

export interface IDeleteUser {
  execute: (id: Id, isPermanent: boolean) => Promise<void>
}