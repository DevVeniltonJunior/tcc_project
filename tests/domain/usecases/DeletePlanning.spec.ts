import { DeletePlanning } from "@/domain/usecases"
import { Planning } from "@/domain/entities"
import { IPlanningCommandRepository } from "@/domain/protocols"
import { Bool, Id } from "@/domain/valueObjects"
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

describe("[Usecases] DeletePlanning", () => {
  let planning_id: Id
  let repository: PlanningCommandRepositoryStub
  let usecase: DeletePlanning

  beforeEach(() => {
    repository = new PlanningCommandRepositoryStub()

    usecase = new DeletePlanning(repository)

    planning_id = Id.generate()
  })

  it("should call repository.softDelete with the correct Planning id", async () => {
    const result = await usecase.execute(planning_id, new Bool(false))

    // Verify that repository.delete was called with the Planning dto
    expect(repository.softDelete).toHaveBeenCalledWith(planning_id)
  })

  it("should call repository.hardDelete with the correct Planning id", async () => {
    const result = await usecase.execute(planning_id, new Bool(true))

    // Verify that repository.delete was called with the Planning dto
    expect(repository.hardDelete).toHaveBeenCalledWith(planning_id)
  })

  it("should propagate errors thrown by the repository", async () => {
    repository.softDelete.mockRejectedValue(new Error("DB error"))

    await expect(usecase.execute(planning_id, new Bool(false))).rejects.toThrow("DB error")
  })
})
