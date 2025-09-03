import { IDeleteBill, IBillCommandRepository } from "@/domain/protocols"
import { Id } from '@/domain/valueObjects'

export class DeleteBill implements IDeleteBill {
  constructor(private readonly repository: IBillCommandRepository) {}

  public async execute(id: Id): Promise<void> {
    await this.repository.softDelete(id)
  }
}
