import { Id } from '@/domain/valueObjects'

export interface IDeleteBill {
  execute: (id: Id) => Promise<void>
}