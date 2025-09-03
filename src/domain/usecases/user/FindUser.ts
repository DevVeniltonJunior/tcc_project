import { IFindUser, IUserQueryRepository, TUser, TFilter } from'@/domain/protocols'
import { User } from '@/domain/entities'

export class FindUser implements IFindUser {
  constructor(private readonly _repository: IUserQueryRepository) {}
  async execute (filter?: TFilter<TUser.Model>): Promise<User> {
    if(!filter) return await this._repository.find()

    return await this._repository.find(filter)
  }
}
