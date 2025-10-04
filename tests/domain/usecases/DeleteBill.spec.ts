import { DeleteBill } from "@/domain/usecases"
import { Bill } from "@/domain/entities"
import { IBillCommandRepository } from "@/domain/protocols"
import { Bool, Id } from "@/domain/valueObjects"
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

describe("[Usecases] DeleteBill", () => {
  let bill_id: Id
  let repository: BillCommandRepositoryStub
  let usecase: DeleteBill

  beforeEach(() => {
    repository = new BillCommandRepositoryStub()

    usecase = new DeleteBill(repository)

    bill_id = Id.generate()
  })

  it("should call repository.softDelete with the correct Bill id", async () => {
    const result = await usecase.execute(bill_id, new Bool(false))

    // Verify that repository.delete was called with the Bill dto
    expect(repository.softDelete).toHaveBeenCalledWith(bill_id)
  })

  it("should call repository.hardDelete with the correct Bill id", async () => {
    const result = await usecase.execute(bill_id, new Bool(true))

    // Verify that repository.delete was called with the Bill dto
    expect(repository.hardDelete).toHaveBeenCalledWith(bill_id)
  })

  it("should propagate errors thrown by the repository", async () => {
    repository.softDelete.mockRejectedValue(new Error("DB error"))

    await expect(usecase.execute(bill_id, new Bool(false))).rejects.toThrow("DB error")
  })
})
