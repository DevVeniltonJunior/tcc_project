import { UpdateBill } from "@/domain/usecases"
import { Bill } from "@/domain/entities"
import { IBillCommandRepository } from "@/domain/protocols"
import { Id, Name } from "@/domain/valueObjects"
import { BillDTO } from "@/domain/dtos"

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

describe("[Usecases] UpdateBill", () => {
  let repository: BillCommandRepositoryStub
  let usecase: UpdateBill
  let bill: BillDTO

  beforeEach(() => {
    repository = new BillCommandRepositoryStub()

    usecase = new UpdateBill(repository)

    bill = new BillDTO(
      Id.generate(),
      new Name("John Doe")
    )
  })

  it("should call repository.update with the correct Bill dto", async () => {
    const result = await usecase.execute(bill)

    // Verify that repository.update was called with the Bill dto
    expect(repository.update).toHaveBeenCalledWith(bill)
  })

  it("should propagate errors thrown by the repository", async () => {
    repository.update.mockRejectedValue(new Error("DB error"))

    await expect(usecase.execute(bill)).rejects.toThrow("DB error")
  })
})
