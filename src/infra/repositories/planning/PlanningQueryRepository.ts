import { Planning } from "@/domain/entities";
import { IPlanningQueryRepository, TFilter, TPlanning } from "@/domain/protocols";
import { Id } from "@/domain/valueObjects";
import { PrismaClient } from '@prisma/client'
import { PlanningAdapter } from "@/infra/adpters";
import { buildWhereInput } from "@/infra/utils";
import { DatabaseException } from "@/infra/exceptions";

const PRISMA_CLIENT = new PrismaClient()

export class PlanningQueryRepository implements IPlanningQueryRepository {
  private readonly _db

  constructor() {
    this._db = PRISMA_CLIENT.planing
  }

  public async get(id: Id): Promise<Planning> {
    const Planning = await this._db.findUnique({where: { id: id.toString() }})

    if (!Planning) throw new DatabaseException("Planning not found")

    return PlanningAdapter.toEntity(Planning)
  }

  public async find(filters?: TFilter<TPlanning.Model>): Promise<Planning> {
    const where = buildWhereInput<TPlanning.Model>(filters, {
      stringFields: ["id", "userId", "name", "description", "goal", "plan"],
      dateFields: ["createdAt", "updatedAt", "deletedAt"],
    })
    const Planning = await this._db.findFirst({ where: where })

    if (!Planning) throw new DatabaseException("Planning not found")

    return PlanningAdapter.toEntity(Planning)
  }

  public async list(filters?: TFilter<TPlanning.Model>): Promise<Planning[]> {
    const where = buildWhereInput<TPlanning.Model>(filters, {
      stringFields: ["id", "userId", "name", "description", "goal", "plan"],
      dateFields: ["createdAt", "updatedAt", "deletedAt"],
    })
    const Plannings = await this._db.findMany({ where: where })

    return Plannings.map(Planning => PlanningAdapter.toEntity(Planning))
  }
  
}