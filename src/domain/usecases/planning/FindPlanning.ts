import { IFindPlanning, IPlanningQueryRepository, TPlanning, TFilter } from'@/domain/protocols'
import { Planning } from '@/domain/entities'
import { BadRequestError } from '@/presentation/exceptions'
import { Id } from '@/domain/valueObjects'

export class FindPlanning implements IFindPlanning {
  constructor(private readonly _repository: IPlanningQueryRepository) {}
  async execute (filter?: TFilter<TPlanning.Model>): Promise<Planning> {
    if (!filter || Object.keys(filter).length === 0) throw new BadRequestError("At least one filter must be provided")
          
    if (filter.id) return await this._repository.get(new Id(filter.id))

    return await this._repository.find(filter)
  }
}
