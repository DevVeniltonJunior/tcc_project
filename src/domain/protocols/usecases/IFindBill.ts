import { Bill } from '@/domain/entities'
import { TFilter, TBill } from '@/domain/protocols'

export interface IFindBill {
  execute: (filter?: TFilter<TBill.Model>) => Promise<Bill>
}
