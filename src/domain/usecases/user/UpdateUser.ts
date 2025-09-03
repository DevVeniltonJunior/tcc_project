import { IUpdateUser, IUserCommandRepository } from "@/domain/protocols"
import { UserDTO } from '@/domain/dtos'

export class UpdateUser implements IUpdateUser {
  constructor(private readonly repository: IUserCommandRepository) {}

  public async execute(entity: UserDTO): Promise<void> {
    await this.repository.update(entity)
  }
}
