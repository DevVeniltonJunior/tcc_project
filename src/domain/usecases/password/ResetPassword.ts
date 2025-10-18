import { Password } from "@/domain/entities";
import { IResetPassword, IPasswordCommandRepository } from "@/domain/protocols";

export class ResetPassword implements IResetPassword {
  constructor(private readonly repository: IPasswordCommandRepository) {}
  async execute(new_password: Password, old_password: Password): Promise<Password> {
    await this.repository.deactivate(old_password.getId())
    return await this.repository.create(new_password)
  }
}
