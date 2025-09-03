import { Password } from "@/domain/entities";
import { IResetPassword, IPasswordCommandRepository } from "@/domain/protocols";

export class ResetPassword implements IResetPassword {
  constructor(private readonly repository: IPasswordCommandRepository) {}
  execute(new_password: Password, old_password: Password): Promise<Password> {
    this.repository.deactivate(old_password.getId())
    return this.repository.create(new_password)
  }
}
