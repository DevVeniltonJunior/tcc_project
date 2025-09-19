import { Password } from "@/domain/entities";
import { IPasswordQueryRepository, TFilter, TPassword } from "@/domain/protocols";
import { Id } from "@/domain/valueObjects";
import { PrismaClient } from '@prisma/client'
import { PasswordAdapter } from "@/infra/adpters";
import { buildWhereInput } from "@/infra/utils";
import { DatabaseException } from "@/infra/exceptions";

const PRISMA_CLIENT = new PrismaClient()

export class PasswordQueryRepository implements IPasswordQueryRepository {
  private readonly _db

  constructor() {
    this._db = PRISMA_CLIENT.password
  }

  public async get(id: Id): Promise<Password> {
    const password = await this._db.findUnique({where: { id: id.toString() }})

    if (!password) throw new DatabaseException("Password not found")

    return PasswordAdapter.toEntity(password)
  }

  public async find(filters?: TFilter<TPassword.Model>): Promise<Password> {
    const where = buildWhereInput<TPassword.Model>(filters, {
      stringFields: ["id", "userId", "password"],
      dateFields: ["createdAt"],
    })
    const Password = await this._db.findFirst({ where: where })

    if (!Password) throw new DatabaseException("Password not found")

    return PasswordAdapter.toEntity(Password)
  }

  public async list(filters?: TFilter<TPassword.Model>): Promise<Password[]> {
    const where = buildWhereInput<TPassword.Model>(filters, {
      stringFields: ["id", "userId", "password"],
      dateFields: ["createdAt"],
    })
    const Passwords = await this._db.findMany({ where: where })

    return Passwords.map(Password => PasswordAdapter.toEntity(Password))
  }
  
}