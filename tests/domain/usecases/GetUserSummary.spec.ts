import { GetUserSummary } from "@/domain/usecases"
import { User, Password, Bill, Planning } from "@/domain/entities"
import { IUserQueryRepository, IGetBillsSummary, TBillsSummary } from "@/domain/protocols"
import { Id, Name, DateEpoch, Email, MoneyValue, PasswordHash, Bool, Goal, Plan } from "@/domain/valueObjects"

describe("[Usecases] GetUserSummary", () => {
  let userRepository: jest.Mocked<IUserQueryRepository>
  let getBillsSummary: jest.Mocked<IGetBillsSummary>
  let usecase: GetUserSummary
  let user: User
  let userId: Id
  let billsSummary: TBillsSummary

  beforeEach(() => {
    userRepository = {
      get: jest.fn()
    } as unknown as jest.Mocked<IUserQueryRepository>

    getBillsSummary = {
      execute: jest.fn()
    } as unknown as jest.Mocked<IGetBillsSummary>

    usecase = new GetUserSummary(userRepository, getBillsSummary)

    userId = Id.generate()

    user = new User(
      userId,
      new Name("John Doe"),
      new DateEpoch(Date.now()),
      new Email("john@example.com"),
      new DateEpoch(Date.now()),
      new Password(Id.generate(), Id.generate(), new PasswordHash("sha"), new Bool(true), new DateEpoch(Date.now())),
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
        ),
        new Planning(
          Id.generate(),
          userId,
          new Name("Planning 2"),
          new Goal("Save for car"),
          new MoneyValue(10000),
          new Plan("Weekly savings plan"),
          new DateEpoch(Date.now())
        )
      ] as Planning[],
      new MoneyValue(5000)
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
      partialValue3MonthsLater: 150,
      fixesBillsNames: "Fixes Bills",
      monthlyMiscBillsNames: "Monthly Misc Bills",
      installmentBillsNames: "Installment Bills"
    }
  })

  it("should return user summary successfully with salary", async () => {
    userRepository.get.mockResolvedValue(user)
    getBillsSummary.execute.mockResolvedValue(billsSummary)

    const result = await usecase.execute(userId)

    expect(userRepository.get).toHaveBeenCalledWith(userId)
    expect(getBillsSummary.execute).toHaveBeenCalledWith(userId)
    expect(result).toEqual({
      id: user.getId().toString(),
      name: user.getName().toString(),
      salary: 5000,
      billsActiveCount: 3,
      planningsCount: 2,
      totalBillsValueMonthly: 1000,
      partialValueNextMonth: 150,
      partialValue2MonthsLater: 200,
      partialValue3MonthsLater: 150
    })
  })

  it("should return user summary with undefined salary when user has no salary", async () => {
    const userWithoutSalary = new User(
      userId,
      new Name("Jane Doe"),
      new DateEpoch(Date.now()),
      new Email("jane@example.com"),
      new DateEpoch(Date.now()),
      new Password(Id.generate(), Id.generate(), new PasswordHash("sha"), new Bool(true), new DateEpoch(Date.now())),
      [] as Bill[],
      [] as Planning[],
      undefined
    )

    userRepository.get.mockResolvedValue(userWithoutSalary)
    getBillsSummary.execute.mockResolvedValue(billsSummary)

    const result = await usecase.execute(userId)

    expect(result.salary).toBeUndefined()
    expect(result.planningsCount).toBe(0)
  })

  it("should return user summary with 0 plannings when user has no plannings", async () => {
    const userWithoutPlannings = new User(
      userId,
      new Name("Bob Smith"),
      new DateEpoch(Date.now()),
      new Email("bob@example.com"),
      new DateEpoch(Date.now()),
      new Password(Id.generate(), Id.generate(), new PasswordHash("sha"), new Bool(true), new DateEpoch(Date.now())),
      [] as Bill[],
      [] as Planning[],
      new MoneyValue(3000)
    )

    userRepository.get.mockResolvedValue(userWithoutPlannings)
    getBillsSummary.execute.mockResolvedValue({
      billsActiveCount: 0,
      totalBillAmount: 0,
      totalValue: 0,
      totalInstallmentValue: 0,
      totalFixedBillsValue: 0,
      totalMonthlyMiscBillsValue: 0,
      partialValueNextMonth: 0,
      partialValue2MonthsLater: 0,
      partialValue3MonthsLater: 0,
      fixesBillsNames: "",
      monthlyMiscBillsNames: "",
      installmentBillsNames: ""
    })

    const result = await usecase.execute(userId)

    expect(result.planningsCount).toBe(0)
    expect(result.billsActiveCount).toBe(0)
    expect(result.totalBillsValueMonthly).toBe(0)
  })

  it("should propagate errors from user repository", async () => {
    userRepository.get.mockRejectedValue(new Error("User DB error"))

    await expect(usecase.execute(userId)).rejects.toThrow("User DB error")
    expect(userRepository.get).toHaveBeenCalledWith(userId)
  })

  it("should propagate errors from getBillsSummary", async () => {
    userRepository.get.mockResolvedValue(user)
    getBillsSummary.execute.mockRejectedValue(new Error("Bills DB error"))

    await expect(usecase.execute(userId)).rejects.toThrow("Bills DB error")
    expect(getBillsSummary.execute).toHaveBeenCalledWith(userId)
  })

  it("should handle user with null salary", async () => {
    const userWithNullSalary = new User(
      userId,
      new Name("Alice Johnson"),
      new DateEpoch(Date.now()),
      new Email("alice@example.com"),
      new DateEpoch(Date.now()),
      new Password(Id.generate(), Id.generate(), new PasswordHash("sha"), new Bool(true), new DateEpoch(Date.now())),
      [] as Bill[],
      [] as Planning[],
      null as any
    )

    userRepository.get.mockResolvedValue(userWithNullSalary)
    getBillsSummary.execute.mockResolvedValue(billsSummary)

    const result = await usecase.execute(userId)

    expect(result.salary).toBeUndefined()
  })

  it("should correctly map all fields from billsSummary", async () => {
    userRepository.get.mockResolvedValue(user)
    getBillsSummary.execute.mockResolvedValue(billsSummary)

    const result = await usecase.execute(userId)

    expect(result.totalBillsValueMonthly).toBe(billsSummary.totalValue)
    expect(result.partialValueNextMonth).toBe(billsSummary.partialValueNextMonth)
    expect(result.partialValue2MonthsLater).toBe(billsSummary.partialValue2MonthsLater)
    expect(result.partialValue3MonthsLater).toBe(billsSummary.partialValue3MonthsLater)
  })
})

