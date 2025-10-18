import { Bill } from '@/domain/entities/'
import { BillDTO } from '@/domain/dtos'
import { Id } from '@/domain/valueObjects'

export interface IBillCommandRepository {
  create: (entity: Bill) => Promise<Bill>
  update: (dto: BillDTO) => Promise<void>
  softDelete: (id: Id) => Promise<void>
  hardDelete: (id: Id) => Promise<void>
}