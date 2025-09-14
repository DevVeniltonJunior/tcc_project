import { UserDTO } from "@/domain/dtos";
import { User } from "@/domain/entities";
import { IUserCommandRepository } from "@/domain/protocols";
import { Id } from "@/domain/valueObjects";
import { PrismaClient } from '@prisma/client'
import { UserAdapter } from "@/infra/adpters";

const PRISMA_CLIENT = new PrismaClient()

export class UserCommandRepository implements IUserCommandRepository {
  private readonly _db

  constructor() {
    this._db = PRISMA_CLIENT.user
  }

  public async create(entity: User): Promise<User> {
    const model = UserAdapter.toModel(entity)

    const createdUser = await this._db.create({ data: model })

    return UserAdapter.toEntity(createdUser)
  }

  public async update(dto: UserDTO): Promise<void> {
    const partial_model = UserAdapter.toPartialModel(dto)
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