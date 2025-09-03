import { ICreateBill, IBillCommandRepository } from "@/domain/protocols"
import { Bill } from '@/domain/entities'

export class CreateBill implements ICreateBill {
  constructor(private readonly repository: IBillCommandRepository) {}

  public async execute(entity: Bill): Promise<Bill> {
    return await this.repository.create(entity)
  }
}
