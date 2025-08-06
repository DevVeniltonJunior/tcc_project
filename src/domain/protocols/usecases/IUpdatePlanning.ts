import { PlanningDTO } from '@/domain/dtos'

export interface IUpdatePlanning {
  execute: (dto: PlanningDTO) => Promise<void>
}