import { IListPlanning, IPlanningQueryRepository, TPlanning, TFilter } from'@/domain/protocols'
import { Planning } from '@/domain/entities'

export class ListPlanning implements IListPlanning {
  constructor(private readonly _repository: IPlanningQueryRepository) {}
  async execute (filter?: TFilter<TPlanning.Model>): Promise<Planning[]> {
    if(!filter) return await this._repository.list()

    return await this._repository.list()
  }
}
