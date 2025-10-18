import { IDeleteBill, IBillCommandRepository } from "@/domain/protocols"
import { Bool, Id } from '@/domain/valueObjects'

export class DeleteBill implements IDeleteBill {
  constructor(private readonly repository: IBillCommandRepository) {}

  public async execute(id: Id, isPermanent: Bool): Promise<void> {
    if (isPermanent.toBoolean()) {
      await this.repository.hardDelete(id)
      return
    }

    await this.repository.softDelete(id)
  }
}
