import { IFindUser, IUserQueryRepository, TUser, TFilter } from'@/domain/protocols'
import { User } from '@/domain/entities'
import { Email, Id } from '@/domain/valueObjects'
import { BadRequestError } from '@/presentation/exceptions'

export class FindUser implements IFindUser {
  constructor(private readonly _repository: IUserQueryRepository) {}
  async execute (filter?: TFilter<TUser.Model>): Promise<User> {
    if (!filter || Object.keys(filter).length === 0) throw new BadRequestError("At least one filter must be provided")
      
    if (filter.id) return await this._repository.get(new Id(filter.id))
    if (filter.email) return await this._repository.getByEmail(new Email(filter.email))

    return await this._repository.find(filter)
  }
}
