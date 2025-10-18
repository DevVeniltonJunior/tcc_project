import { Bool, Id } from '@/domain/valueObjects'

export interface IDeleteBill {
  execute: (id: Id, isPermanent: Bool) => Promise<void>
}