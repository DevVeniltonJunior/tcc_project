import { Planning } from '@/domain/entities/'
import { PlanningDTO } from '@/domain/dtos'
import { Id } from '@/domain/valueObjects'

export interface IPlanningCommandRepository {
  create: (entity: Planning) => Promise<Planning>
  update: (dto: PlanningDTO) => Promise<void>
  softDelete: (id: Id) => Promise<void>
  hardDelete: (id: Id) => Promise<void>
}