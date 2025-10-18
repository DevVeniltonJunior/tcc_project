import { IListBill, IBillQueryRepository, TBill, TFilter } from'@/domain/protocols'
import { Bill } from '@/domain/entities'

export class ListBill implements IListBill {
  constructor(private readonly _repository: IBillQueryRepository) {}
  async execute (filter?: TFilter<TBill.Model>): Promise<Bill[]> {
    if(!filter) return await this._repository.list()

    return await this._repository.list()
  }
}
