import { GetUserSummaryController } from "@/presentation/controllers/GetUserSummaryController"
import { GetUserSummary } from "@/domain/usecases"
import { GetBillsSummary } from "@/domain/utils"
import { UserQueryRepository, BillQueryRepository } from "@/infra/repositories"
import { User, Password, Bill, Planning } from "@/domain/entities"
import { Id, Name, DateEpoch, Email, MoneyValue, PasswordHash, Bool, Goal, Plan } from "@/domain/valueObjects"
import { BadRequestError, NotFoundError } from "@/presentation/exceptions"
import { DatabaseException } from "@/infra/exceptions"
import { InvalidParam } from "@/domain/exceptions"
import { TBillsSummary } from "@/domain/protocols"

describe("[Controller] GetUserSummaryController", () => {
  let getUserSummaryExecuteSpy: jest.SpyInstance
  let getBillsSummaryExecuteSpy: jest.SpyInstance
  let user: User
  let userId: Id
  let billsSummary: TBillsSummary

  const makeRequest = (userId?: string) => ({
    body: {},
    params: {},
    query: {},
    userId: userId
  } as any)

  beforeEach(() => {
    jest.restoreAllMocks()

    userId = Id.generate()

    user = new User(
      userId,
      new Name("Jane Doe"),
      new DateEpoch("1995-06-15"),
      new Email("jane_doe@email.com"),
      new DateEpoch(Date.now()),
      new Password(
        Id.generate(),
        Id.generate(),
        new PasswordHash("hash"),
        new Bool(true),
        new DateEpoch(Date.now())
      ),
      [] as Bill[],
      [
        new Planning(
          Id.generate(),
          userId,
          new Name("Planning 1"),
          new Goal("Save for vacation"),
          new MoneyValue(5000),
          new Plan("Monthly savings plan"),
          new DateEpoch(Date.now())
        )
      ] as Planning[],
      new MoneyValue(2500)
    )

    billsSummary = {
      billsActiveCount: 3,
      totalBillAmount: 1500,
      totalValue: 1000,
      totalInstallmentValue: 300,
      totalFixedBillsValue: 500,
      totalMonthlyMiscBillsValue: 200,
      partialValueNextMonth: 150,
      partialValue2MonthsLater: 200,
      partialValue3MonthsLater: 150
    }

    getBillsSummaryExecuteSpy = jest
      .spyOn(GetBillsSummary.prototype, "execute")
      .mockResolvedValue(billsSummary)

    getUserSummaryExecuteSpy = jest
      .spyOn(GetUserSummary.prototype, "execute")
      .mockResolvedValue({
        id: user.getId().toString(),
        name: user.getName().toString(),
        salary: 2500,
        billsActiveCount: 3,
        planningsCount: 1,
        totalBillsValueMonthly: 1000,
        partialValueNextMonth: 150,
        partialValue2MonthsLater: 200,
        partialValue3MonthsLater: 150
      })

    jest.spyOn(UserQueryRepository.prototype, "get").mockResolvedValue(user)
    jest.spyOn(BillQueryRepository.prototype, "list").mockResolvedValue([] as Bill[])
  })

  it("should get user summary successfully with valid userId", async () => {
    const req = makeRequest(userId.toString())

    const result = await GetUserSummaryController.handle(req)

    expect(result.statusCode).toBe(200)
    expect(result.data).toEqual({
      summary: {
        id: user.getId().toString(),
        name: user.getName().toString(),
        salary: 2500,
        billsActiveCount: 3,
        planningsCount: 1,
        totalBillsValueMonthly: 1000,
        partialValueNextMonth: 150,
        partialValue2MonthsLater: 200,
        partialValue3MonthsLater: 150
      }
    })
    expect(getUserSummaryExecuteSpy).toHaveBeenCalled()
  })

  it("should return 400 if userId is missing", async () => {
    const req = makeRequest(undefined)

    const result = await GetUserSummaryController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "Missing required parameter: userId" })
    expect(getUserSummaryExecuteSpy).not.toHaveBeenCalled()
  })

  it("should return 400 if userId is empty string", async () => {
    const req = makeRequest("")

    const result = await GetUserSummaryController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "Missing required parameter: userId" })
  })

  it("should return 400 if BadRequestError is thrown", async () => {
    getUserSummaryExecuteSpy.mockRejectedValueOnce(new BadRequestError("Invalid request"))

    const req = makeRequest(userId.toString())

    const result = await GetUserSummaryController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "Invalid request" })
  })

  it("should return 400 if InvalidParam is thrown", async () => {
    getUserSummaryExecuteSpy.mockRejectedValueOnce(new InvalidParam("userId is invalid"))

    const req = makeRequest(userId.toString())

    const result = await GetUserSummaryController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "userId is invalid" })
  })

  it("should return 404 if NotFoundError is thrown", async () => {
    getUserSummaryExecuteSpy.mockRejectedValueOnce(new NotFoundError("User not found"))

    const req = makeRequest(userId.toString())

    const result = await GetUserSummaryController.handle(req)

    expect(result.statusCode).toBe(404)
    expect(result.data).toEqual({ error: "User not found" })
  })

  it("should return 404 if DatabaseException with 'User not found' message is thrown", async () => {
    getUserSummaryExecuteSpy.mockRejectedValueOnce(new DatabaseException("User not found"))

    const req = makeRequest(userId.toString())

    const result = await GetUserSummaryController.handle(req)

    expect(result.statusCode).toBe(404)
    expect(result.data).toEqual({ error: "User not found" })
  })

  it("should return 500 if unexpected error occurs", async () => {
    getUserSummaryExecuteSpy.mockRejectedValueOnce(new Error("Unexpected DB crash"))

    const req = makeRequest(userId.toString())

    const result = await GetUserSummaryController.handle(req)

    expect(result.statusCode).toBe(500)
    expect(result.data).toEqual({ error: "Unexpected DB crash" })
  })

  it("should return 500 if DatabaseException with different message is thrown", async () => {
    getUserSummaryExecuteSpy.mockRejectedValueOnce(new DatabaseException("Connection timeout"))

    const req = makeRequest(userId.toString())

    const result = await GetUserSummaryController.handle(req)

    expect(result.statusCode).toBe(500)
    expect(result.data).toEqual({ error: "Connection timeout" })
  })

  it("should handle user without salary", async () => {
    getUserSummaryExecuteSpy.mockResolvedValueOnce({
      id: user.getId().toString(),
      name: user.getName().toString(),
      salary: undefined,
      billsActiveCount: 2,
      planningsCount: 0,
      totalBillsValueMonthly: 500,
      partialValueNextMonth: 100,
      partialValue2MonthsLater: 0,
      partialValue3MonthsLater: 0
    })

    const req = makeRequest(userId.toString())

    const result = await GetUserSummaryController.handle(req)

    expect(result.statusCode).toBe(200)
    expect(result.data.summary.salary).toBeUndefined()
  })

  it("should handle user with no bills", async () => {
    getUserSummaryExecuteSpy.mockResolvedValueOnce({
      id: user.getId().toString(),
      name: user.getName().toString(),
      salary: 3000,
      billsActiveCount: 0,
      planningsCount: 1,
      totalBillsValueMonthly: 0,
      partialValueNextMonth: 0,
      partialValue2MonthsLater: 0,
      partialValue3MonthsLater: 0
    })

    const req = makeRequest(userId.toString())

    const result = await GetUserSummaryController.handle(req)

    expect(result.statusCode).toBe(200)
    expect(result.data.summary.billsActiveCount).toBe(0)
    expect(result.data.summary.totalBillsValueMonthly).toBe(0)
  })

  it("should successfully integrate GetBillsSummary and GetUserSummary", async () => {
    const req = makeRequest(userId.toString())

    const result = await GetUserSummaryController.handle(req)

    expect(result.statusCode).toBe(200)
    expect(result.data.summary).toBeDefined()
    expect(getUserSummaryExecuteSpy).toHaveBeenCalledWith(expect.any(Id))
  })
})

