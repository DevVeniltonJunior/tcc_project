import { Planning } from '@/domain/entities/'
import { TFilter, TPlanning, TPagination } from '@/domain/protocols'
import { Id } from '@/domain/valueObjects'

export interface IPlanningQueryRepository {
  get: (id: Id) => Promise<Planning>
  find: (filters?: TFilter<TPlanning.Model>) => Promise<Planning>
  list: (filters?: TFilter<TPlanning.Model>) => Promise<Planning[]>
  listPaginated: (filters?: TFilter<TPlanning.Model>, pagination?: TPagination.Request) => Promise<TPagination.Response<Planning>>
}
