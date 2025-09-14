import { UserDTO } from '@/domain/dtos'
import { Bill, Password, Planning, User } from '@/domain/entities'
import { TUser } from '@/domain/protocols'
import { Id, Name, Email, DateEpoch, MoneyValue, PasswordHash, Bool, Description, InstallmentsNumber, Goal, Plan } from '@/domain/valueObjects'

export class UserAdapter {
  public static toEntity(model: TUser.Model): User {
    return new User(
      new Id(model.id),
      new Name(model.name),
      new DateEpoch(model.birthdate),
      new Email(model.email),
      new DateEpoch(model.createdAt),
      undefined,
      undefined,
      undefined,
      model.salary ? new MoneyValue(model.salary) : undefined,
      model.updatedAt ? new DateEpoch(model.updatedAt) : undefined,
      model.deletedAt ? new DateEpoch(model.deletedAt) : undefined
    )
  }

  public static toModel(entity: User): TUser.Model {
    const json_entity = entity.toJson()
    const { password, bills, planning, ...model } = json_entity

    return model
  }

  public static toPartialModel(dto: UserDTO): Partial<TUser.Model> {
    return dto.toJson()
  }

  public static toDTO(model: TUser.DTO): UserDTO {
    return new UserDTO(
      new Id(model.id),
      model.name ? new Name(model.name) : undefined,
      model.birthdate ? new DateEpoch(model.birthdate) : undefined,
      model.email ? new Email(model.email) : undefined,
      model.salary ? new MoneyValue(model.salary) : undefined,
      model.updatedAt ? new DateEpoch(model.updatedAt) : undefined,
      model.deletedAt ? new DateEpoch(model.deletedAt) : undefined
    )
  }
}