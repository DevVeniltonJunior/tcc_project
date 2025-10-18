import { ICreateUser, IUserCommandRepository } from "@/domain/protocols"
import { User } from '@/domain/entities'

export class CreateUser implements ICreateUser {
  constructor(private readonly repository: IUserCommandRepository) {}

  public async execute(entity: User): Promise<User> {
    return await this.repository.create(entity)
  }
}
