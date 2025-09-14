import { PlanningDTO } from "@/domain/dtos"
import { Planning } from "@/domain/entities"
import { TPlanning } from "@/domain/protocols"
import { DateEpoch, Id, Name } from "@/domain/valueObjects"
import { PlanningAdapter } from "@/infra/adpters"

describe("[Adapter] Planning", () => {
  const userId = Id.generate()
  const baseModel: TPlanning.Entity = {
    id: Id.generate().toString(),
    userId: userId.toString(),
    name: "Aobs haj",
    description: "Roberto",
    goal: "Ranto justos",
    goalValue: 350000,
    plan: "roger reginaldo",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  it("should convert model to entity", () => {
    const entity = PlanningAdapter.toEntity(baseModel)

    expect(entity).toBeInstanceOf(Planning)
    expect(entity.getId()).toBeInstanceOf(Id)
    expect(entity.getName()).toBeInstanceOf(Name)
    expect(entity.getCreatedAt()).toBeInstanceOf(DateEpoch)
    expect(entity.getUpdatedAt()).toBeInstanceOf(DateEpoch)
    expect(entity.getDeletedAt()).toBeUndefined()
  })

  it("should convert entity back to model", () => {
    const entity = PlanningAdapter.toEntity(baseModel)

    expect(PlanningAdapter.toModel(entity)).toEqual({
      id: baseModel.id,
      userId: baseModel.userId,
      name: baseModel.name,
      description: baseModel.description,
      goal: baseModel.goal,
      goalValue: baseModel.goalValue,
      plan: baseModel.plan,
      createdAt: baseModel.createdAt,
      updatedAt: baseModel.updatedAt,
      deletedAt: baseModel.deletedAt
    })
  })

  it("should convert DTO to partial model", () => {
    const dto = new PlanningDTO(
      new Id(baseModel.id),
      new Name(baseModel.name)
    )

    const partial = PlanningAdapter.toPartialModel(dto)

    expect(partial).toEqual({
      id: baseModel.id,
      name: baseModel.name
    })
  })

  it("should convert model to DTO", () => {
    const dtoModel: TPlanning.DTO = {
      id: baseModel.id,
      name: baseModel.name
    }

    const dto = PlanningAdapter.toDTO(dtoModel)
    const dtoJson = dto.toJson()

    expect(dto).toBeInstanceOf(PlanningDTO)
    expect(dtoJson.id).toBe(baseModel.id)
    expect(dtoJson.name).toBe(baseModel.name)
    expect(dtoJson.deletedAt).toBeUndefined()
  })
})
