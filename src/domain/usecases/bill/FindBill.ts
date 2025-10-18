import { IFindBill, IBillQueryRepository, TBill, TFilter } from'@/domain/protocols'
import { Bill } from '@/domain/entities'
import { Id } from '@/domain/valueObjects'
import { BadRequestError } from '@/presentation/exceptions'

export class FindBill implements IFindBill {
  constructor(private readonly _repository: IBillQueryRepository) {}
  async execute (filter?: TFilter<TBill.Model>): Promise<Bill> {
    if (!filter || Object.keys(filter).length === 0) throw new BadRequestError("At least one filter must be provided")
          
    if (filter.id) return await this._repository.get(new Id(filter.id))

    return await this._repository.find(filter)
  }
}
