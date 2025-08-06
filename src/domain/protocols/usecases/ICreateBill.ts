import { Bill } from '@/domain/entities'

export interface ICreateBill {
  execute: (entity: Bill) => Promise<Bill>
}