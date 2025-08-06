import { Planning } from '@/domain/entities'

export interface ICreatePlanning {
  execute: (entity: Planning) => Promise<Planning>
}