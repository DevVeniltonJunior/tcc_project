import { UserDTO } from '@/domain/dtos'
import { Bill, Password, Planning, User } from '@/domain/entities'
import { TUser } from '@/domain/protocols'
import { Id, Name, Email, DateEpoch, MoneyValue, PasswordHash, Bool, Description, InstallmentsNumber, Goal, Plan } from '@/domain/valueObjects'

export class UserAdapter {
  public static toEntity(model: TUser.Entity): User {
    return new User(
      new Id(model.id),
      new Name(model.name),
      new DateEpoch(model.birthdate),
      new Email(model.email),
      new Password(
        new Id(model.password.id),
        new Id(model.id),
        new PasswordHash(model.password.password),
        new Bool(model.password.active),
        new DateEpoch(model.password.createdAt)
      ),
      model.bills ? model.bills.map(bill => new Bill(
        new Id(bill.id),
        new Id(model.id),
        new Name(bill.name),
        new MoneyValue(bill.value),
        new DateEpoch(bill.createdAt),
        bill.description ? new Description(bill.description) : undefined,
        bill.installmentsNumber ? new InstallmentsNumber(bill.installmentsNumber) : undefined,
        bill.updatedAt ? new DateEpoch(bill.updatedAt) : undefined,
        bill.deletedAt ? new DateEpoch(bill.deletedAt) : undefined
      )) : [],
      model.planning ? model.planning.map(plan => new Planning(
        new Id(plan.id),
        new Id(model.id),
        new Name(plan.name),
        new Goal(plan.goal),
        new MoneyValue(plan.goalValue),
        new Plan(plan.plan),
        new DateEpoch(plan.createdAt),
        plan.description ? new Description(plan.description) : undefined,
        plan.updatedAt ? new DateEpoch(plan.updatedAt) : undefined,
        plan.deletedAt ? new DateEpoch(plan.deletedAt) : undefined
      )) : [],
      new DateEpoch(model.createdAt),
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