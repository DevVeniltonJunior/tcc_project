import { CreateBillController } from "@/presentation/controllers"
import { CreateBill, FindUser } from "@/domain/usecases"
import { Bill, User } from "@/domain/entities"
import { Id, DateEpoch, Name, Email, MoneyValue, Description, InstallmentsNumber } from "@/domain/valueObjects"
import { InvalidParam } from "@/domain/exceptions"
import { BadRequestError, NotFoundError } from "@/presentation/exceptions"

describe("[Controller] CreateBillController", () => {
  let usecaseSpy: jest.SpyInstance
  let userUsecaseSpy: jest.SpyInstance
  let bill: Bill
  let user: User

  const makeRequest = (body: any = {}, userId?: string) => ({
    body,
    params: {},
    query: {},
    userId: userId || Id.generate().toString()
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

    bill = new Bill(
      Id.generate(),
      Id.generate(),
      new Name("Internet"),
      new MoneyValue(120.00),
      new DateEpoch(Date.now()),
      new Description("Internet bill"),
      new InstallmentsNumber(12)
    )

    usecaseSpy = jest.spyOn(CreateBill.prototype, "execute")
    userUsecaseSpy = jest.spyOn(FindUser.prototype, "execute")
  })

  it("should create a Bill successfully", async () => {
    usecaseSpy.mockResolvedValue(bill)
    userUsecaseSpy.mockResolvedValue(user)

    const req = makeRequest({
      userId: bill.getUserId().toString(),
      name: "Internet",
      value: 120.00
    })

    const result = await CreateBillController.handle(req)

    expect(result.statusCode).toBe(201)
    expect(result.data).toEqual(bill.toJson())
    expect(usecaseSpy).toHaveBeenCalled()
  })

  it("should return 400 if required fields are missing", async () => {
    const req = makeRequest({
      name: "invalid@email.com"
    }, user.getId().toString())

    const result = await CreateBillController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toHaveProperty("error")
  })

  it("should return 404 if user not exists", async () => {
    const req = makeRequest({
      userId: bill.getUserId().toString(),
      name: "Internet",
      value: 120.00
    })

    const result = await CreateBillController.handle(req)

    expect(result.statusCode).toBe(404)
    expect(result.data).toHaveProperty("error")
  })

  it("should return 400 if InvalidParam is thrown", async () => {
    userUsecaseSpy.mockResolvedValue(user)
    usecaseSpy.mockRejectedValueOnce(new InvalidParam("name"))

    const req = makeRequest({
      name: "Internet",
      value: 120.00
    }, user.getId().toString())

    const result = await CreateBillController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toHaveProperty("error")
  })

  it("should return 500 if an unexpected error occurs", async () => {
    userUsecaseSpy.mockResolvedValue(user)
    usecaseSpy.mockRejectedValueOnce(new Error("DB crash"))

    const req = makeRequest({
      userId: bill.getUserId().toString(),
      name: "Internet",
      value: 120.00
    })

    const result = await CreateBillController.handle(req)

    expect(result.statusCode).toBe(500)
    expect(result.data).toEqual({ error: "DB crash" })
  })
})
