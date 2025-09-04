import { ListPlanning } from "@/domain/usecases"
import { Planning } from "@/domain/entities"
import { IPlanningQueryRepository, TFilter, TPlanning } from "@/domain/protocols"
import { Id, Name, DateEpoch, Goal, MoneyValue, Plan } from "@/domain/valueObjects"

describe("[Usecases] ListPlanning", () => {
  let repository: jest.Mocked<IPlanningQueryRepository>
  let usecase: ListPlanning
  let plannings: Planning[]

  beforeEach(() => {
    repository = {
      list: jest.fn()
    } as unknown as jest.Mocked<IPlanningQueryRepository>

    usecase = new ListPlanning(repository)

    plannings = [
      new Planning(
        Id.generate(),
        Id.generate(),
        new Name("John Doe"),
        new Goal("asad"),
        new MoneyValue(100),
        new Plan("john@example.com"),
        new DateEpoch(Date.now())
      ),
      new Planning(
        Id.generate(),
        Id.generate(),
        new Name("Jone Doe"),
        new Goal("sdsfa"),
        new MoneyValue(100),
        new Plan("john@example.com"),
        new DateEpoch(Date.now())
      )
    ]
  })

  it("should return all Plannings when no filter is provided", async () => {
    repository.list.mockResolvedValue(plannings)

    const result = await usecase.execute()

    expect(repository.list).toHaveBeenCalled()
    expect(result).toEqual(plannings)
  })

  it("should return all Plannings when a filter is provided (currently ignored)", async () => {
    repository.list.mockResolvedValue(plannings)
    const filter: TFilter<TPlanning.Model> = { name: "John Doe" }

    const result = await usecase.execute(filter)

    expect(repository.list).toHaveBeenCalled()
    expect(result).toEqual(plannings)
  })

  it("should propagate errors from the repository", async () => {
    repository.list.mockRejectedValue(new Error("DB error"))

    await expect(usecase.execute()).rejects.toThrow("DB error")
  })
})
