import { User } from "@/domain/entities";
import { IUserQueryRepository, TFilter, TUser } from "@/domain/protocols";
import { Id } from "@/domain/valueObjects";
import { PrismaClient } from '@prisma/client'
import { UserAdapter } from "@/infra/adpters";
import { buildWhereInput } from "@/infra/utils";

const PRISMA_CLIENT = new PrismaClient()

export class UserQueryRepository implements IUserQueryRepository {
  private readonly _db

  constructor() {
    this._db = PRISMA_CLIENT.user
  }

  public async get(id: Id): Promise<User | null> {
    const user = await this._db.findUnique({where: { id: id.toString() }})

    if (!user) return null

    return UserAdapter.toEntity(user)
  }

  public async find(filters?: TFilter<TUser.Model>): Promise<User | null> {
    const where = buildWhereInput<TUser.Model>(filters, {
      stringFields: ["id", "name", "email"],
      dateFields: ["birthdate", "createdAt", "updatedAt", "deletedAt"],
    })
    const user = await this._db.findFirst({ where: where })

    if (!user) return null

    return UserAdapter.toEntity(user)
  }

  public async list(filters?: TFilter<TUser.Model>): Promise<User[]> {
    const where = buildWhereInput<TUser.Model>(filters, {
      stringFields: ["id", "name", "email"],
      dateFields: ["birthdate", "createdAt", "updatedAt", "deletedAt"],
    })
    const users = await this._db.findMany({ where: where })

    return users.map(user => UserAdapter.toEntity(user))
  }
  
}