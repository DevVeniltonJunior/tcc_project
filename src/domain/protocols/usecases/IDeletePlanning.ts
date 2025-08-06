import { Id } from '@/domain/valueObjects'

export interface IDeletePlanning {
  execute: (id: Id) => Promise<void>
}