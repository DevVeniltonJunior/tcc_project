import { CreatePlanning } from "@/domain/usecases"
import { Planning } from "@/domain/entities"
import { IPlanningCommandRepository } from "@/domain/protocols"
import { Id, Name, DateEpoch, MoneyValue, Goal, Plan } from "@/domain/valueObjects"
import { PlanningDTO } from "../dtos"

export class PlanningCommandRepositoryStub implements IPlanningCommandRepository {
  // Use jest.fn so we can spy/assert calls
  public create = jest.fn<Promise<Planning>, [Planning]>(async (entity: Planning) => {
    return entity
  })

  public update = jest.fn<Promise<void>, [PlanningDTO]>(async (dto: PlanningDTO) => {
    return
  })

  public softDelete = jest.fn<Promise<void>, [Id]>(async (_id: Id) => {
    return
  })

  public hardDelete = jest.fn<Promise<void>, [Id]>(async (_id: Id) => {
    return
  })
}

describe("[Usecases] CreatePlanning", () => {
  let repository: PlanningCommandRepositoryStub
  let createPlanning: CreatePlanning
  let planning: Planning

  beforeEach(() => {
    repository = new PlanningCommandRepositoryStub()

    createPlanning = new CreatePlanning(repository)

    const Planning_id = Id.generate()

    planning = new Planning(
      Planning_id,
      Id.generate(),
      new Name("John Doe"),
      new Goal("asad"),
      new MoneyValue(100),
      new Plan("john@example.com"),
      new DateEpoch(Date.now())
    )
  })

  it("should call repository.create with the correct Planning entity", async () => {
    repository.create.mockResolvedValue(planning)

    const result = await createPlanning.execute(planning)

    // Verify that repository.create was called with the Planning entity
    expect(repository.create).toHaveBeenCalledWith(planning)

    // Verify that the result is the same Planning returned by the repository
    expect(result).toBe(planning)
  })

  it("should propagate errors thrown by the repository", async () => {
    repository.create.mockRejectedValue(new Error("DB error"))

    await expect(createPlanning.execute(planning)).rejects.toThrow("DB error")
  })
})
