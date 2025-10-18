import { FindPlanning } from "@/domain/usecases"
import { Planning } from "@/domain/entities"
import { IPlanningQueryRepository, TFilter, TPlanning } from "@/domain/protocols"
import { Id, Name, DateEpoch, Plan, MoneyValue, Goal } from "@/domain/valueObjects"

describe("[Usecases] FindPlanning", () => {
  let repository: jest.Mocked<IPlanningQueryRepository>
  let usecase: FindPlanning
  let planning: Planning

  beforeEach(() => {
    repository = {
      find: jest.fn(),
      get: jest.fn()
    } as unknown as jest.Mocked<IPlanningQueryRepository>

    usecase = new FindPlanning(repository)

    planning = new Planning(
        Id.generate(),
        Id.generate(),
        new Name("John Doe"),
        new Goal("asad"),
        new MoneyValue(100),
        new Plan("john@example.com"),
        new DateEpoch(Date.now())
      )
  })

  it("should get a Planning per id", async () => {
    repository.get.mockResolvedValue(planning)

    const result = await usecase.execute({id: Id.generate().toString()})

    expect(repository.get).toHaveBeenCalled()
    expect(result).toEqual(planning)
  })

  it("should return all Plannings when a filter is provided (currently ignored)", async () => {
    repository.find.mockResolvedValue(planning)
    const filter: TFilter<TPlanning.Model> = { name: "John Doe" }

    const result = await usecase.execute(filter)

    expect(repository.find).toHaveBeenCalled()
    expect(result).toEqual(planning)
  })

  it("should propagate errors from the repository", async () => {
    repository.find.mockRejectedValue(new Error("DB error"))

    await expect(usecase.execute({name:"aobs"})).rejects.toThrow("DB error")
  })

  it("should throw an error when filter is not provided", async () => {
    repository.find.mockRejectedValue(new Error("At least one filter must be provided"))

    await expect(usecase.execute()).rejects.toThrow("At least one filter must be provided")
  })
})
