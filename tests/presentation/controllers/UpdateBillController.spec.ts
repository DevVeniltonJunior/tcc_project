import { UpdateBillController } from "@/presentation/controllers/UpdateBillController"
import { FindBill, UpdateBill } from "@/domain/usecases"
import { BillCommandRepository } from "@/infra/repositories"
import { InvalidParam } from "@/domain/exceptions"
import { BadRequestError } from "@/presentation/exceptions"
import { DateEpoch, Email, Id, MoneyValue, Name } from "@/domain/valueObjects"
import { User } from "@/domain/entities"

describe("[Controller] UpdateBillController", () => {
  let usecaseSpy: jest.SpyInstance
  let queryUsecaseSpy: jest.SpyInstance
  let user: User

  const makeRequest = (body: any = {}) => ({
    body,
    params: {},
    query: {}
  })

  beforeEach(() => {
    jest.restoreAllMocks()

    user = new User(
      Id.generate(),
      new Name("Jane Doe"),
      new DateEpoch("1995-06-15"),
      new Email("jane_doe@email.com"),
      new DateEpoch(Date.now()),
      undefined,
      undefined,
      undefined,
      new MoneyValue(2500)
    )

    queryUsecaseSpy = jest.spyOn(FindBill.prototype, "execute")
    usecaseSpy = jest.spyOn(UpdateBill.prototype, "execute").mockResolvedValue(undefined)
    // Evita instância real de repositório
    jest.spyOn(BillCommandRepository.prototype, "update").mockResolvedValue(undefined)
  })

  it("should update Bill successfully", async () => {
    queryUsecaseSpy.mockResolvedValue(user)

    const req = makeRequest({
      id: Id.generate(),
      name: "Jane Doe"
    })

    const result = await UpdateBillController.handle(req)

    expect(result.statusCode).toBe(200)
    expect(result.data).toEqual({ message: "Bill updated successfully" })
    expect(usecaseSpy).toHaveBeenCalled()
  })

  it("should return 400 if required field id is missing", async () => {
    queryUsecaseSpy.mockResolvedValue(user)

    const req = makeRequest({
      name: "Jane Doe"
    })

    const result = await UpdateBillController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toHaveProperty("error")
    expect(result.data.error).toMatch(/id/i)
  })

  it("should return 400 if InvalidParam is thrown", async () => {
    usecaseSpy.mockRejectedValueOnce(new InvalidParam("email"))
    queryUsecaseSpy.mockResolvedValue(user)

    const req = makeRequest({
      id: 4,
      name: "Jane Doe"
    })

    const result = await UpdateBillController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "4 is invalid" })
  })

  it("should return 400 if BadRequestError is thrown", async () => {
    usecaseSpy.mockRejectedValueOnce(new BadRequestError("Invalid data"))
    queryUsecaseSpy.mockResolvedValue(user)

    const req = makeRequest({
      id: Id.generate(),
      goalValue: -100
    })

    const result = await UpdateBillController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "Invalid data" })
  })

  it("should return 404 if user not exists", async () => {
    const req = makeRequest({
      id: Id.generate().toString(),
      name: "Internet"
    })

    const result = await UpdateBillController.handle(req)

    expect(result.statusCode).toBe(404)
    expect(result.data).toHaveProperty("error")
  })

  it("should return 500 if unexpected error is thrown", async () => {
    queryUsecaseSpy.mockResolvedValue(user)
    usecaseSpy.mockRejectedValueOnce(new Error("Database crash"))

    const req = makeRequest({
      id: Id.generate(),
      name: "Jane Doe"
    })

    const result = await UpdateBillController.handle(req)

    expect(result.statusCode).toBe(500)
    expect(result.data).toEqual({ error: "Database crash" })
  })
})
