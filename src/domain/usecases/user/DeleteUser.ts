import { IDeleteUser, IUserCommandRepository } from "@/domain/protocols"
import { Bool, Id } from '@/domain/valueObjects'

export class DeleteUser implements IDeleteUser {
  constructor(private readonly repository: IUserCommandRepository) {}

  public async execute(id: Id, isPermanent: Bool): Promise<void> {
    if (isPermanent.toBoolean()) {
      await this.repository.hardDelete(id)
      return
    }
    
    await this.repository.softDelete(id)
  }
}
