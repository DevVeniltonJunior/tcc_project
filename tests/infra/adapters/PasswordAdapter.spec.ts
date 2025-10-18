import { Bill, Planning, Password } from "@/domain/entities"
import { TPassword } from "@/domain/protocols"
import { Bool, DateEpoch, Email, Id, MoneyValue, Name, PasswordHash } from "@/domain/valueObjects"
import { PasswordAdapter } from "@/infra/adpters"

describe("[Adapter] Password", () => {
  const userId = Id.generate()
  const baseModel: TPassword.Entity = {
      id: Id.generate().toString(),
      userId: userId.toString(),
      password: "hd@153aas",
      active: true,
      createdAt: new Date().toISOString()
  }

  it("should convert model to entity", () => {
    const entity = PasswordAdapter.toEntity(baseModel)

    expect(entity).toBeInstanceOf(Password)
    expect(entity.getId()).toBeInstanceOf(Id)
    expect(entity.getUserId()).toBeInstanceOf(Id)
    expect(entity.getPassword()).toBeInstanceOf(PasswordHash)
    expect(entity.isActive()).toBeInstanceOf(Bool)
    expect(entity.getCreatedAt()).toBeInstanceOf(DateEpoch)
  })

  it("should convert entity back to model", () => {
    const entity = PasswordAdapter.toEntity(baseModel)

    expect(PasswordAdapter.toModel(entity)).toEqual({
      id: baseModel.id,
      userId: baseModel.userId,
      password: baseModel.password,
      active: baseModel.active,
      createdAt: baseModel.createdAt,
    })
  })
})
