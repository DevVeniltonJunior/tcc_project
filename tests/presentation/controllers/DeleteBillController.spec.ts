import { DeleteBillController } from "@/presentation/controllers/DeleteBillController"
import { DeleteBill, FindBill } from "@/domain/usecases"
import { BillCommandRepository } from "@/infra/repositories"
import { BadRequestError } from "@/presentation/exceptions"
import { InvalidParam } from "@/domain/exceptions"
import { Bool, DateEpoch, Description, Id, InstallmentsNumber, MoneyValue, Name } from "@/domain/valueObjects"
import { Bill } from "@/domain/entities"

describe("[Controller] DeleteBillController", () => {
  let usecaseSpy: jest.SpyInstance
  let queryUsecaseSpy: jest.SpyInstance
  let bill: Bill

  const makeRequest = (params: any = {}, query: any = {}, userId?: string) => ({
    body: {},
    params,
    query,
    userId: userId || Id.generate().toString()
  })

  beforeEach(() => {
    const userId = Id.generate()
    
    bill = new Bill(
      Id.generate(),
      userId,
      new Name("Internet"),
      new MoneyValue(120.00),
      new DateEpoch(Date.now()),
      new Description("Internet bill"),
      new InstallmentsNumber(12)
    )

    jest.restoreAllMocks()
    queryUsecaseSpy = jest.spyOn(FindBill.prototype, "execute")
    usecaseSpy = jest.spyOn(DeleteBill.prototype, "execute").mockResolvedValue(undefined)
    jest.spyOn(BillCommandRepository.prototype, "softDelete").mockResolvedValue(undefined)
    jest.spyOn(BillCommandRepository.prototype, "hardDelete").mockResolvedValue(undefined)
  })

  it("should delete Bill successfully (soft delete by default)", async () => {
    queryUsecaseSpy.mockResolvedValue(bill)

    const req = makeRequest({ id: bill.getId().toString() }, {}, bill.getUserId().toString())

    const result = await DeleteBillController.handle(req)

    expect(result.statusCode).toBe(200)
    expect(result.data).toEqual({ message: "Bill deleted successfully" })
    expect(usecaseSpy).toHaveBeenCalledWith(bill.getId(), new Bool(false))
  })

  it("should delete Bill permanently if query.permanent=true", async () => {
    queryUsecaseSpy.mockResolvedValue(bill)

    const req = makeRequest({ id: bill.getId().toString() }, { permanent: "true" }, bill.getUserId().toString())

    const result = await DeleteBillController.handle(req)

    expect(result.statusCode).toBe(200)
    expect(result.data).toEqual({ message: "Bill deleted successfully" })
    expect(usecaseSpy).toHaveBeenCalledWith(bill.getId(), new Bool(true))
  })

  it("should return 400 if id is missing", async () => {
    queryUsecaseSpy.mockResolvedValue(bill)

    const req = makeRequest({}, { permanent: "true" })

    const result = await DeleteBillController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "Mising required parameter: Id" })
  })

  it("should return 400 if InvalidParam is thrown", async () => {
    queryUsecaseSpy.mockResolvedValue(bill)

    usecaseSpy.mockRejectedValueOnce(new InvalidParam("id"))

    const req = makeRequest({ id: bill.getId().toString() }, {}, bill.getUserId().toString())

    const result = await DeleteBillController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toHaveProperty("error")
    expect(result.data.error).toContain("id")
  })

  it("should return 404 if Bill not exists", async () => {
      const req = makeRequest({
        id: Id.generate().toString(),
        name: "Internet"
      })
  
      const result = await DeleteBillController.handle(req)
  
      expect(result.statusCode).toBe(404)
      expect(result.data).toHaveProperty("error")
    })

  it("should return 500 if unexpected error occurs", async () => {
    queryUsecaseSpy.mockResolvedValue(bill)

    usecaseSpy.mockRejectedValueOnce(new Error("Database crash"))

    const req = makeRequest({ id: bill.getId().toString() }, {}, bill.getUserId().toString())

    const result = await DeleteBillController.handle(req)

    expect(result.statusCode).toBe(500)
    expect(result.data).toEqual({ error: "Database crash" })
  })
})
