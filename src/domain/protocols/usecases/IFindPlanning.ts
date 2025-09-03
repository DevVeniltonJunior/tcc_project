import { Planning } from '@/domain/entities'
import { TFilter, TPlanning } from '@/domain/protocols'

export interface IFindPlanning {
  execute: (filter?: TFilter<TPlanning.Model>) => Promise<Planning>
}
