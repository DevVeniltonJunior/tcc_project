import { Planning } from "@/domain/entities";
import { IPlanningQueryRepository, TFilter, TPlanning, TPagination } from "@/domain/protocols";
import { Id } from "@/domain/valueObjects";
import { PrismaClient } from '@prisma/client'
import { PlanningAdapter } from "@/infra/adpters";
import { buildWhereInput } from "@/infra/utils";
import { DatabaseException } from "@/infra/exceptions";

const PRISMA_CLIENT = new PrismaClient()

export class PlanningQueryRepository implements IPlanningQueryRepository {
  private readonly _db

  constructor() {
    this._db = PRISMA_CLIENT.planning
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
    const Plannings = await this._db.findMany({ where: where, orderBy: { createdAt: 'desc' } })

    return Plannings.map((Planning: any) => PlanningAdapter.toEntity(Planning))
  }

  public async listPaginated(filters?: TFilter<TPlanning.Model>, pagination?: TPagination.Request): Promise<TPagination.Response<Planning>> {
    const where = buildWhereInput<TPlanning.Model>(filters, {
      stringFields: ["id", "userId", "name", "description", "goal", "plan"],
      dateFields: ["createdAt", "updatedAt", "deletedAt"],
    })
    
    const page = pagination?.page || 1
    const limit = pagination?.limit || 10
    const skip = (page - 1) * limit
    
    // Build orderBy object
    const orderBy: any = {}
    if (pagination?.sortBy) {
      orderBy[pagination.sortBy] = pagination.order || 'asc'
    } else {
      orderBy.createdAt = 'desc' // Default ordering
    }

    const [Plannings, total] = await Promise.all([
      this._db.findMany({ 
        where: where,
        skip: skip,
        take: limit,
        orderBy: orderBy
      }),
      this._db.count({ where: where })
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: Plannings.map((Planning: any) => PlanningAdapter.toEntity(Planning)),
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }
  }
  
}