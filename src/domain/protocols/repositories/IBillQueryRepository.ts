import { Bill } from '@/domain/entities/'
import { Id } from '@/domain/valueObjects'
import { TFilter, TBill, TPagination } from '@/domain/protocols'

export interface IBillQueryRepository {
  get: (id: Id) => Promise<Bill>
  find: (filters?: TFilter<TBill.Model>) => Promise<Bill>
  list: (filters?: TFilter<TBill.Model>) => Promise<Bill[]>
  listPaginated: (filters?: TFilter<TBill.Model>, pagination?: TPagination.Request) => Promise<TPagination.Response<Bill>>
}
