import { Bill } from "@/domain/entities";
import { IBillQueryRepository, TFilter, TBill, TPagination } from "@/domain/protocols";
import { Id } from "@/domain/valueObjects";
import { PrismaClient } from '@prisma/client'
import { BillAdapter } from "@/infra/adpters";
import { buildWhereInput } from "@/infra/utils";
import { DatabaseException } from "@/infra/exceptions";

const PRISMA_CLIENT = new PrismaClient()

export class BillQueryRepository implements IBillQueryRepository {
  private readonly _db

  constructor() {
    this._db = PRISMA_CLIENT.bill
  }

  public async get(id: Id): Promise<Bill> {
    const Bill = await this._db.findUnique({where: { id: id.toString() }})

    if (!Bill) throw new DatabaseException("Bill not found")

    return BillAdapter.toEntity(Bill)
  }

  public async find(filters?: TFilter<TBill.Model>): Promise<Bill> {
    const where = buildWhereInput<TBill.Model>(filters, {
      stringFields: ["id", "name", "userId", "description"],
      dateFields: ["createdAt", "updatedAt", "deletedAt"],
    })
    const Bill = await this._db.findFirst({ where: where })

    if (!Bill) throw new DatabaseException("Bill not found")

    return BillAdapter.toEntity(Bill)
  }

  public async list(filters?: TFilter<TBill.Model>): Promise<Bill[]> {
    const where = buildWhereInput<TBill.Model>(filters, {
      stringFields: ["id", "name", "userId", "description"],
      dateFields: ["createdAt", "updatedAt", "deletedAt"],
    })
    const Bills = await this._db.findMany({ where: where })

    return Bills.map(Bill => BillAdapter.toEntity(Bill))
  }

  public async listPaginated(filters?: TFilter<TBill.Model>, pagination?: TPagination.Request): Promise<TPagination.Response<Bill>> {
    const where = buildWhereInput<TBill.Model>(filters, {
      stringFields: ["id", "name", "userId", "description"],
      dateFields: ["createdAt", "updatedAt", "deletedAt"],
    })
    
    const page = pagination?.page || 1
    const limit = pagination?.limit || 10
    const skip = (page - 1) * limit

    const [Bills, total] = await Promise.all([
      this._db.findMany({ 
        where: where,
        skip: skip,
        take: limit
      }),
      this._db.count({ where: where })
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      data: Bills.map(Bill => BillAdapter.toEntity(Bill)),
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }
  }
  
}