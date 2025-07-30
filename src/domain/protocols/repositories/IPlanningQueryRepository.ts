import { Planning } from '@/domain/entities/'
import { Id } from '@/domain/valueObjects'

export interface IPlanningQueryRepository {
  get: (id: Id) => Promise<Planning>
  find: (filters: Partial<Planning>) => Promise<Planning>
  list: (filters?: Partial<Planning>) => Promise<Planning[]>
}
