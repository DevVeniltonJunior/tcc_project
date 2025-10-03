import { Bool, Id } from '@/domain/valueObjects'

export interface IDeletePlanning {
  execute: (id: Id, isPermanent: Bool) => Promise<void>
}