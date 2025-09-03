import { IFindPlanning, IPlanningQueryRepository, TPlanning, TFilter } from'@/domain/protocols'
import { Planning } from '@/domain/entities'

export class FindPlanning implements IFindPlanning {
  constructor(private readonly _repository: IPlanningQueryRepository) {}
  async execute (filter?: TFilter<TPlanning.Model>): Promise<Planning> {
    if(!filter) return await this._repository.find()

    return await this._repository.find(filter)
  }
}
