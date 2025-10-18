import { CreateBill } from "@/domain/usecases"
import { Bill } from "@/domain/entities"
import { IBillCommandRepository } from "@/domain/protocols"
import { Id, Name, DateEpoch, MoneyValue } from "@/domain/valueObjects"
import { BillDTO } from "../dtos"

export class BillCommandRepositoryStub implements IBillCommandRepository {
  // Use jest.fn so we can spy/assert calls
  public create = jest.fn<Promise<Bill>, [Bill]>(async (entity: Bill) => {
    return entity
  })

  public update = jest.fn<Promise<void>, [BillDTO]>(async (dto: BillDTO) => {
    return
  })

  public softDelete = jest.fn<Promise<void>, [Id]>(async (_id: Id) => {
    return
  })

  public hardDelete = jest.fn<Promise<void>, [Id]>(async (_id: Id) => {
    return
  })
}

describe("[Usecases] CreateBill", () => {
  let repository: BillCommandRepositoryStub
  let usecase: CreateBill
  let bill: Bill

  beforeEach(() => {
    repository = new BillCommandRepositoryStub()

    usecase = new CreateBill(repository)

    bill = new Bill(
      Id.generate(),
      Id.generate(),
      new Name("John Doe"),
      new MoneyValue(100),
      new DateEpoch(Date.now())
    )
  })

  it("should call repository.create with the correct Bill entity", async () => {
    repository.create.mockResolvedValue(bill)

    const result = await usecase.execute(bill)

    // Verify that repository.create was called with the Bill entity
    expect(repository.create).toHaveBeenCalledWith(bill)

    // Verify that the result is the same Bill returned by the repository
    expect(result).toBe(bill)
  })

  it("should propagate errors thrown by the repository", async () => {
    repository.create.mockRejectedValue(new Error("DB error"))

    await expect(usecase.execute(bill)).rejects.toThrow("DB error")
  })
})
