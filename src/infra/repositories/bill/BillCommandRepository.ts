import { BillDTO } from "@/domain/dtos";
import { Bill } from "@/domain/entities";
import { IBillCommandRepository } from "@/domain/protocols";
import { Id } from "@/domain/valueObjects";
import { PrismaClient } from '@prisma/client'
import { BillAdapter } from "@/infra/adpters";

const PRISMA_CLIENT = new PrismaClient()

export class BillCommandRepository implements IBillCommandRepository {
  private readonly _db

  constructor() {
    this._db = PRISMA_CLIENT.bill
  }

  public async create(entity: Bill): Promise<Bill> {
    const model = BillAdapter.toModel(entity)

    const createdBill = await this._db.create({ data: model })

    return BillAdapter.toEntity(createdBill)
  }

  public async update(dto: BillDTO): Promise<void> {
    const partial_model = BillAdapter.toPartialModel(dto)
    const id = partial_model.id

    delete partial_model.id

    await this._db.update({ where: {id}, data: partial_model })
  }

  public async softDelete(id: Id): Promise<void> {
    await this._db.update({ where: {id: id.toString()}, data: { deletedAt: new Date().toISOString() }})
  }
  
  public async hardDelete(id: Id): Promise<void> {
    await this._db.delete({where: { id: id.toString() }})
  }
}