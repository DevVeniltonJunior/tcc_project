import { IUpdateBill, IBillCommandRepository } from "@/domain/protocols"
import { BillDTO } from '@/domain/dtos'

export class UpdateBill implements IUpdateBill {
  constructor(private readonly repository: IBillCommandRepository) {}

  public async execute(entity: BillDTO): Promise<void> {
    await this.repository.update(entity)
  }
}
