import { Bill } from '@/domain/entities/'
import { Id } from '@/domain/valueObjects'

export interface IBillQueryRepository {
  get: (id: Id) => Promise<Bill>
  find: (filters: Partial<Bill>) => Promise<Bill>
  list: (filters?: Partial<Bill>) => Promise<Bill[]>
}
