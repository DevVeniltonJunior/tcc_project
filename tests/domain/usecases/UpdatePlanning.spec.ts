import { UpdatePlanning } from "@/domain/usecases"
import { Planning } from "@/domain/entities"
import { IPlanningCommandRepository } from "@/domain/protocols"
import { Id, Name } from "@/domain/valueObjects"
import { PlanningDTO } from "@/domain/dtos"

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

describe("[Usecases] UpdatePlanning", () => {
  let repository: PlanningCommandRepositoryStub
  let usecase: UpdatePlanning
  let planning: PlanningDTO

  beforeEach(() => {
    repository = new PlanningCommandRepositoryStub()

    usecase = new UpdatePlanning(repository)

    planning = new PlanningDTO(
      Id.generate(),
      new Name("John Doe")
    )
  })

  it("should call repository.update with the correct Planning dto", async () => {
    const result = await usecase.execute(planning)

    // Verify that repository.update was called with the Planning dto
    expect(repository.update).toHaveBeenCalledWith(planning)
  })

  it("should propagate errors thrown by the repository", async () => {
    repository.update.mockRejectedValue(new Error("DB error"))

    await expect(usecase.execute(planning)).rejects.toThrow("DB error")
  })
})
