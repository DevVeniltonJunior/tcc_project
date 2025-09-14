import { UserDTO } from "@/domain/dtos"
import { Bill, Password, Planning, User } from "@/domain/entities"
import { TUser } from "@/domain/protocols"
import { DateEpoch, Email, Id, MoneyValue, Name } from "@/domain/valueObjects"
import { UserAdapter } from "@/infra/adpters"

describe("[Adapter] User", () => {
  const userId = Id.generate()
  const baseModel: TUser.Entity = {
    id: userId.toString(),
    name: "Internet",
    birthdate: new Date().toISOString(),
    email: "JohnDoe@gmail.com",
    salary: 2531.00,
    password: {
      id: Id.generate().toString(),
      userId: userId.toString(),
      password: "hd@153aas",
      active: true,
      createdAt: new Date().toISOString()
    },
    bills: [
      {
        id: Id.generate().toString(),
        userId: userId.toString(),
        name: "Internet",
        value: 120.5,
        createdAt: new Date().toISOString(),
        description: "Monthly internet bill",
        installmentsNumber: 12,
        updatedAt: new Date().toISOString(),
        deletedAt: undefined
      }
    ],
    planning: [
      {
        id: Id.generate().toString(),
        userId: userId.toString(),
        name: "Aobs haj",
        description: "Roberto",
        goal: "Ranto justos",
        goalValue: 350000,
        plan: "roger reginaldo",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: new Date().toISOString(),
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: undefined
  }

  it("should convert model to entity", () => {
    const entity = UserAdapter.toEntity(baseModel)

    expect(entity).toBeInstanceOf(User)
    expect(entity.getId()).toBeInstanceOf(Id)
    expect(entity.getName()).toBeInstanceOf(Name)
    expect(entity.getEmail()).toBeInstanceOf(Email)
    expect(entity.getCreatedAt()).toBeInstanceOf(DateEpoch)
    expect(entity.getBills()).toBeInstanceOf(Array<Bill>)
    expect(entity.getPlanning()).toBeInstanceOf(Array<Planning>)
    expect(entity.getPassword()).toBeInstanceOf(Password)
    expect(entity.getUpdatedAt()).toBeInstanceOf(DateEpoch)
    expect(entity.getDeletedAt()).toBeUndefined()
    expect(entity.getSalary()).toBeInstanceOf(MoneyValue)
  })

  it("should convert entity back to model", () => {
    const entity = UserAdapter.toEntity(baseModel)

    expect(UserAdapter.toModel(entity)).toEqual({
      id: baseModel.id,
      name: baseModel.name,
      birthdate: baseModel.birthdate,
      email: baseModel.email,
      salary: baseModel.salary,
      createdAt: baseModel.createdAt,
      updatedAt: baseModel.updatedAt,
      deletedAt: baseModel.deletedAt
    })
  })

  it("should convert DTO to partial model", () => {
    const dto = new UserDTO(
      new Id(baseModel.id),
      new Name(baseModel.name),
      new DateEpoch(baseModel.birthdate)
    )

    const partial = UserAdapter.toPartialModel(dto)

    expect(partial).toEqual({
      id: baseModel.id,
      name: baseModel.name,
      birthdate: baseModel.birthdate
    })
  })

  it("should convert model to DTO", () => {
    const dtoModel: TUser.DTO = {
      id: baseModel.id,
      name: baseModel.name,
      birthdate: baseModel.birthdate
    }

    const dto = UserAdapter.toDTO(dtoModel)
    const dtoJson = dto.toJson()

    expect(dto).toBeInstanceOf(UserDTO)
    expect(dtoJson.id).toBe(baseModel.id)
    expect(dtoJson.name).toBe(baseModel.name)
    expect(dtoJson.birthdate).toBe(baseModel.birthdate)
    expect(dtoJson.deletedAt).toBeUndefined()
  })
})
