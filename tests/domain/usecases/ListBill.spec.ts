import { ListBill } from "@/domain/usecases"
import { Bill, Password, Planning } from "@/domain/entities"
import { IBillQueryRepository, TFilter, TBill } from "@/domain/protocols"
import { Id, Name, DateEpoch, Email, MoneyValue, PasswordHash, Bool } from "@/domain/valueObjects"

describe("[Usecases] ListBill", () => {
  let repository: jest.Mocked<IBillQueryRepository>
  let usecase: ListBill
  let bills: Bill[]

  beforeEach(() => {
    repository = {
      list: jest.fn()
    } as unknown as jest.Mocked<IBillQueryRepository>

    usecase = new ListBill(repository)

    bills = [
      new Bill(
        Id.generate(),
        Id.generate(),
        new Name("John Doe"),
        new MoneyValue(100),
        new DateEpoch(Date.now())
      ),
      new Bill(
        Id.generate(),
        Id.generate(),
        new Name("Jone Doe"),
        new MoneyValue(200),
        new DateEpoch(Date.now())
      )
    ]
  })

  it("should return all Bills when no filter is provided", async () => {
    repository.list.mockResolvedValue(bills)

    const result = await usecase.execute()

    expect(repository.list).toHaveBeenCalled()
    expect(result).toEqual(bills)
  })

  it("should return all Bills when a filter is provided (currently ignored)", async () => {
    repository.list.mockResolvedValue(bills)
    const filter: TFilter<TBill.Model> = { name: "John Doe" }

    const result = await usecase.execute(filter)

    expect(repository.list).toHaveBeenCalled()
    expect(result).toEqual(bills)
  })

  it("should propagate errors from the repository", async () => {
    repository.list.mockRejectedValue(new Error("DB error"))

    await expect(usecase.execute()).rejects.toThrow("DB error")
  })
})
