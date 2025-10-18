import { Password } from "@/domain/entities";
import { ICreatePassword, IPasswordCommandRepository } from "@/domain/protocols";

export class CreatePassword implements ICreatePassword {
  constructor(private readonly repository: IPasswordCommandRepository) {}
  execute(entity: Password): Promise<Password> {
    return this.repository.create(entity)
  }
}
