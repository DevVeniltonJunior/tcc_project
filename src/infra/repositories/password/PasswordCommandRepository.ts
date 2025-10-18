import { Password } from "@/domain/entities";
import { IPasswordCommandRepository } from "@/domain/protocols";
import { Id } from "@/domain/valueObjects";
import { PrismaClient } from '@prisma/client'
import { PasswordAdapter } from "@/infra/adpters";

const PRISMA_CLIENT = new PrismaClient()

export class PasswordCommandRepository implements IPasswordCommandRepository {
  private readonly _db

  constructor() {
    this._db = PRISMA_CLIENT.password
  }

  public async create(entity: Password): Promise<Password> {
    const model = PasswordAdapter.toModel(entity)

    const createdPassword = await this._db.create({ data: model })

    return PasswordAdapter.toEntity(createdPassword)
  }

  public async deactivate(id: Id): Promise<void> {
    await this._db.update({ where: { id: id.toString() }, data: { active: false } })
  }
}