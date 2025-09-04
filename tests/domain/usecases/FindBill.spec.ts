import { FindBill } from "@/domain/usecases"
import { Bill } from "@/domain/entities"
import { IBillQueryRepository, TFilter, TBill } from "@/domain/protocols"
import { Id, Name, DateEpoch, Email, MoneyValue, PasswordHash, Bool } from "@/domain/valueObjects"

describe("[Usecases] FindBill", () => {
  let repository: jest.Mocked<IBillQueryRepository>
  let usecase: FindBill
  let bill: Bill

  beforeEach(() => {
    repository = {
      find: jest.fn()
    } as unknown as jest.Mocked<IBillQueryRepository>

    usecase = new FindBill(repository)

    bill = new Bill(
        Id.generate(),
        Id.generate(),
        new Name("John Doe"),
        new MoneyValue(100),
        new DateEpoch(Date.now())
      )
  })

  it("should return all Bills when no filter is provided", async () => {
    repository.find.mockResolvedValue(bill)

    const result = await usecase.execute()

    expect(repository.find).toHaveBeenCalled()
    expect(result).toEqual(bill)
  })

  it("should return all Bills when a filter is provided (currently ignored)", async () => {
    repository.find.mockResolvedValue(bill)
    const filter: TFilter<TBill.Model> = { name: "John Doe" }

    const result = await usecase.execute(filter)

    expect(repository.find).toHaveBeenCalled()
    expect(result).toEqual(bill)
  })

  it("should propagate errors from the repository", async () => {
    repository.find.mockRejectedValue(new Error("DB error"))

    await expect(usecase.execute()).rejects.toThrow("DB error")
  })
})
