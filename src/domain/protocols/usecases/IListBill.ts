import { Bill } from '@/domain/entities'
import { TFilter, TBill } from '@/domain/protocols'

export interface IListBill {
  execute: (filter?: TFilter<TBill.Model>) => Promise<Bill[]>
}
