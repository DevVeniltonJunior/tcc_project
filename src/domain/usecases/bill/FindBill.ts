import { IFindBill, IBillQueryRepository, TBill, TFilter } from'@/domain/protocols'
import { Bill } from '@/domain/entities'

export class FindBill implements IFindBill {
  constructor(private readonly _repository: IBillQueryRepository) {}
  async execute (filter?: TFilter<TBill.Model>): Promise<Bill> {
    if(!filter) return await this._repository.find()

    return await this._repository.find(filter)
  }
}
