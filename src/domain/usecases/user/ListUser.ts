import { IListUser, IUserQueryRepository, TUser, TFilter } from'@/domain/protocols'
import { User } from '@/domain/entities'

export class ListUser implements IListUser {
  constructor(private readonly _repository: IUserQueryRepository) {}
  async execute (filter?: TFilter<TUser.Model>): Promise<User[]> {
    if(!filter) return await this._repository.list()

    return await this._repository.list()
  }
}
