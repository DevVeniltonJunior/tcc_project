import { BillDTO } from "@/domain/dtos"
import { Bill } from "@/domain/entities"
import { TBill } from "@/domain/protocols"
import { DateEpoch, Description, Id, InstallmentsNumber, MoneyValue, Name } from "@/domain/valueObjects"
import { BillAdapter } from "@/infra/adpters"

describe("[Adapter] Bill", () => {
  const billId = Id.generate()
  const userId = Id.generate()
  const baseModel: TBill.Entity = {
    id: billId.toString(),
    userId: userId.toString(),
    name: "Internet",
    value: 120.5,
    createdAt: new Date().toISOString(),
    description: "Monthly internet bill",
    installmentsNumber: 12,
    updatedAt: new Date().toISOString(),
    deletedAt: undefined
  }

  it("should convert model to entity", () => {
    const entity = BillAdapter.toEntity(baseModel)

    expect(entity).toBeInstanceOf(Bill)
    expect(entity.getId()).toBeInstanceOf(Id)
    expect(entity.getUserId()).toBeInstanceOf(Id)
    expect(entity.getName()).toBeInstanceOf(Name)
    expect(entity.getValue()).toBeInstanceOf(MoneyValue)
    expect(entity.getCreatedAt()).toBeInstanceOf(DateEpoch)
    expect(entity.getDescription()).toBeInstanceOf(Description)
    expect(entity.getInstallmentsNumber()).toBeInstanceOf(InstallmentsNumber)
    expect(entity.getUpdatedAt()).toBeInstanceOf(DateEpoch)
    expect(entity.getDeletedAt()).toBeUndefined()
  })

  it("should convert entity back to model", () => {
    const entity = BillAdapter.toEntity(baseModel)
    const model = BillAdapter.toModel(entity)

    expect(model).toEqual({
      id: baseModel.id,
      userId: baseModel.userId,
      name: baseModel.name,
      value: baseModel.value,
      createdAt: baseModel.createdAt,
      description: baseModel.description,
      installmentsNumber: baseModel.installmentsNumber,
      updatedAt: baseModel.updatedAt,
      deletedAt: baseModel.deletedAt
    })
  })

  it("should convert DTO to partial model", () => {
    const dto = new BillDTO(
      new Id(baseModel.id),
      new Name(baseModel.name),
      new MoneyValue(baseModel.value),
      baseModel.description ? new Description(baseModel.description) : undefined,
      baseModel.installmentsNumber ? new InstallmentsNumber(baseModel.installmentsNumber) : undefined,
      baseModel.updatedAt ? new DateEpoch(baseModel.updatedAt) : undefined,
      undefined
    )

    const partial = BillAdapter.toPartialModel(dto)

    expect(partial).toEqual({
      id: baseModel.id,
      name: baseModel.name,
      value: baseModel.value,
      description: baseModel.description,
      installmentsNumber: baseModel.installmentsNumber,
      updatedAt: baseModel.updatedAt
    })
  })

  it("should convert model to DTO", () => {
    const dtoModel: TBill.DTO = {
      id: baseModel.id,
      name: baseModel.name,
      value: baseModel.value,
      description: baseModel.description,
      installmentsNumber: baseModel.installmentsNumber,
      updatedAt: baseModel.updatedAt,
      deletedAt: undefined
    }

    const dto = BillAdapter.toDTO(dtoModel)
    const dtoJson = dto.toJson()

    expect(dto).toBeInstanceOf(BillDTO)
    expect(dtoJson.id).toBe(baseModel.id)
    expect(dtoJson.name).toBe(baseModel.name)
    expect(dtoJson.value).toBe(baseModel.value)
    expect(dtoJson.description).toBe(baseModel.description)
    expect(dtoJson.installmentsNumber).toBe(baseModel.installmentsNumber)
    expect(dtoJson.updatedAt).toBe(baseModel.updatedAt)
    expect(dtoJson.deletedAt).toBeUndefined()
  })
})
