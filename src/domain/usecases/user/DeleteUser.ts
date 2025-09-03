import { IDeleteUser, IUserCommandRepository } from "@/domain/protocols"
import { Id } from '@/domain/valueObjects'

export class DeleteUser implements IDeleteUser {
  constructor(private readonly repository: IUserCommandRepository) {}

  public async execute(id: Id): Promise<void> {
    await this.repository.softDelete(id)
  }
}
