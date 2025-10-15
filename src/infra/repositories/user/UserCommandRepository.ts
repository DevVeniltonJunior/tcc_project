import { UserDTO } from "@/domain/dtos";
import { User } from "@/domain/entities";
import { IUserCommandRepository } from "@/domain/protocols";
import { Id } from "@/domain/valueObjects";
import { PrismaClient } from '@prisma/client'
import { UserAdapter } from "@/infra/adpters";
import { DatabaseException } from "@/infra/exceptions";

const PRISMA_CLIENT = new PrismaClient()

export class UserCommandRepository implements IUserCommandRepository {
  private readonly _db

  constructor() {
    this._db = PRISMA_CLIENT.user
  }

  public async create(entity: User): Promise<User> {
    try {
      const model = UserAdapter.toModel(entity)

      const password = model.password
      delete model.password
      const bills = model.bills
      delete model.bills
      const planning = model.planning
      delete model.planning

      const data: any = {
        ...model,
      }

      if (password) {
        delete (<any>password).userId
        data.password = { create: password }
      }
      if (bills) {
        delete (<any>bills).userId
        data.bills = { create: bills }
      }
      if (planning) {
        delete (<any>planning).userId
        data.planings = { create: planning }
      }

      const createdUser = await this._db.create({ data: data, include: { password: true, bills: true, planings: true } })

      return UserAdapter.toEntity(createdUser)
    }
    catch(error: any) {
      throw new DatabaseException(error.message)
    }
  }

  public async update(dto: UserDTO): Promise<void> {
    try {
      const partial_model = UserAdapter.toPartialModel(dto)
      const id = partial_model.id

      delete partial_model.id

      await this._db.update({ where: {id}, data: partial_model })
    }
    catch(error: any) {
      throw new DatabaseException(error.message)
    }
  }

  public async softDelete(id: Id): Promise<void> {
    try {
      await this._db.update({ where: {id: id.toString()}, data: { deletedAt: new Date().toISOString() }})
    }
    catch(error: any) {
      throw new DatabaseException(error.message)
    }
  }
  
  public async hardDelete(id: Id): Promise<void> {
    try {
      await this._db.delete({where: { id: id.toString() }})
    }
    catch(error: any) {
      throw new DatabaseException(error.message)
    }
  }
}