import { PlanningDTO } from "@/domain/dtos";
import { Planning } from "@/domain/entities";
import { IPlanningCommandRepository } from "@/domain/protocols";
import { Id } from "@/domain/valueObjects";
import { PrismaClient } from '@prisma/client'
import { PlanningAdapter } from "@/infra/adpters";

const PRISMA_CLIENT = new PrismaClient()

export class PlanningCommandRepository implements IPlanningCommandRepository {
  private readonly _db

  constructor() {
    this._db = PRISMA_CLIENT.planing
  }

  public async create(entity: Planning): Promise<Planning> {
    const model = PlanningAdapter.toModel(entity)

    const createdPlanning = await this._db.create({ data: model })

    return PlanningAdapter.toEntity(createdPlanning)
  }

  public async update(dto: PlanningDTO): Promise<void> {
    const partial_model = PlanningAdapter.toPartialModel(dto)
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