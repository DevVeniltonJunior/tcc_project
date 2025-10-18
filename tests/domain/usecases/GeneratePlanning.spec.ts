import { GeneratePlanning } from "@/domain/usecases/planning/GeneratePlanning"
import { Bill, Planning, User } from "@/domain/entities"
import { IBillQueryRepository, IPlanningCommandRepository, TBillsSummary, TBill, TFilter } from "@/domain/protocols"
import { Id, Name, DateEpoch, MoneyValue, Goal, Plan, Description, Email, InstallmentsNumber } from "@/domain/valueObjects"
import { BillDTO, PlanningDTO } from "../dtos"
import { IAIService, JSONSchema, AIStructuredResponse, AIResponse } from "@/infra/protocols"
import { BadRequestError } from "@/presentation/exceptions"
import { DatabaseException } from "@/infra/exceptions"

export class PlanningCommandRepositoryStub implements IPlanningCommandRepository {
  public create = jest.fn<Promise<Planning>, [Planning]>(async (entity: Planning) => {
    return entity
  })

  public update = jest.fn<Promise<void>, [PlanningDTO]>(async (dto: PlanningDTO) => {
    return
  })

  public softDelete = jest.fn<Promise<void>, [Id]>(async (_id: Id) => {
    return
  })

  public hardDelete = jest.fn<Promise<void>, [Id]>(async (_id: Id) => {
    return
  })
}

export class BillQueryRepositoryStub implements IBillQueryRepository {
  public get = jest.fn<Promise<Bill>, [Id]>(async (_id: Id) => {
    throw new DatabaseException("Bill not found")
  })

  public find = jest.fn<Promise<Bill>, [TFilter<TBill.Model>?]>(async (_filters?: TFilter<TBill.Model>) => {
    throw new DatabaseException("Bill not found")
  })

  public list = jest.fn<Promise<Bill[]>, [TFilter<TBill.Model>?]>(async (_filters?: TFilter<TBill.Model>) => {
    return []
  })
}

export class AIServiceStub implements IAIService {
  public generate = jest.fn<Promise<AIResponse>, [string, string?]>(
    async (_prompt: string, _model?: string) => {
      return {
        text: "Generated response",
        model: "gpt-4"
      }
    }
  )

  public generateStructured = jest.fn<Promise<AIStructuredResponse<any>>, [string, JSONSchema, string?]>(
    async (_prompt: string, _schema: JSONSchema, _model?: string) => {
      return {
        data: {
          name: "Financial Plan",
          plan: "Save 20% of your salary monthly",
          description: "A comprehensive plan to achieve your goals"
        },
        model: "gpt-4"
      }
    }
  )
}

describe("[Usecases] GeneratePlanning", () => {
  let planningRepository: PlanningCommandRepositoryStub
  let billRepository: BillQueryRepositoryStub
  let aiService: AIServiceStub
  let usecase: GeneratePlanning
  let user: User
  let userId: Id
  let goal: Goal
  let goalValue: MoneyValue
  let description: Description

  beforeEach(() => {
    planningRepository = new PlanningCommandRepositoryStub()
    billRepository = new BillQueryRepositoryStub()
    aiService = new AIServiceStub()

    usecase = new GeneratePlanning(planningRepository, billRepository, aiService)

    userId = Id.generate()
    user = new User(
      userId,
      new Name("John Doe"),
      new DateEpoch(new Date("1990-01-01")),
      new Email("john@example.com"),
      new DateEpoch(Date.now()),
      undefined,
      undefined,
      undefined,
      new MoneyValue(5000)
    )

    goal = new Goal("Buy a car")
    goalValue = new MoneyValue(30000)
    description = new Description("Save money to buy a new car")
  })

  it("should throw BadRequestError when user does not have a salary", async () => {
    const userWithoutSalary = new User(
      userId,
      new Name("John Doe"),
      new DateEpoch(new Date("1990-01-01")),
      new Email("john@example.com"),
      new DateEpoch(Date.now())
    )

    await expect(
      usecase.execute(userWithoutSalary, goal, goalValue, description)
    ).rejects.toThrow(new BadRequestError("User does not have a salary"))
  })

  it("should call billRepository.list with correct userId", async () => {
    billRepository.list.mockResolvedValue([])

    await usecase.execute(user, goal, goalValue, description)

    expect(billRepository.list).toHaveBeenCalledWith({ userId: userId.toString() })
  })

  it("should handle empty bills list and return zero summary", async () => {
    billRepository.list.mockResolvedValue([])
    aiService.generateStructured.mockResolvedValue({
      data: {
        name: "Financial Plan",
        plan: "Save money monthly",
        description: "Plan description"
      },
      model: "gpt-4"
    })

    await usecase.execute(user, goal, goalValue, description)

    // Verify AI service was called with zero summary
    expect(aiService.generateStructured).toHaveBeenCalled()
    const callArgs = aiService.generateStructured.mock.calls[0]
    const prompt = callArgs[0]
    
    expect(prompt).toContain('"totalBillAmount":0')
    expect(prompt).toContain('"totalValue":0')
  })

  it("should calculate bills summary correctly with fixed bills", async () => {
    const fixedBill1 = new Bill(
      Id.generate(),
      userId,
      new Name("Rent"),
      new MoneyValue(1000),
      new DateEpoch(Date.now())
    )

    const fixedBill2 = new Bill(
      Id.generate(),
      userId,
      new Name("Internet"),
      new MoneyValue(100),
      new DateEpoch(Date.now())
    )

    billRepository.list.mockResolvedValue([fixedBill1, fixedBill2])

    await usecase.execute(user, goal, goalValue, description)

    const callArgs = aiService.generateStructured.mock.calls[0]
    const prompt = callArgs[0]
    
    expect(prompt).toContain('"totalFixedBillsValue":1100')
  })

  it("should calculate bills summary correctly with monthly misc bills", async () => {
    const now = new Date()
    const monthlyBill = new Bill(
      Id.generate(),
      userId,
      new Name("Groceries"),
      new MoneyValue(500),
      new DateEpoch(now),
      undefined,
      new InstallmentsNumber(1)
    )

    billRepository.list.mockResolvedValue([monthlyBill])

    await usecase.execute(user, goal, goalValue, description)

    const callArgs = aiService.generateStructured.mock.calls[0]
    const prompt = callArgs[0]
    
    expect(prompt).toContain('"totalMonthlyMiscBillsValue":500')
  })

  it("should calculate bills summary correctly with installment bills", async () => {
    const createdDate = new Date()
    createdDate.setMonth(createdDate.getMonth() - 2) // Created 2 months ago

    const installmentBill = new Bill(
      Id.generate(),
      userId,
      new Name("Laptop"),
      new MoneyValue(300),
      new DateEpoch(createdDate),
      undefined,
      new InstallmentsNumber(12)
    )

    billRepository.list.mockResolvedValue([installmentBill])

    await usecase.execute(user, goal, goalValue, description)

    const callArgs = aiService.generateStructured.mock.calls[0]
    const prompt = callArgs[0]
    
    expect(prompt).toContain('"totalInstallmentValue":300')
  })

  it("should not include completed installment bills in the summary", async () => {
    const createdDate = new Date()
    createdDate.setMonth(createdDate.getMonth() - 12) // Created 12 months ago

    const completedInstallmentBill = new Bill(
      Id.generate(),
      userId,
      new Name("Phone"),
      new MoneyValue(200),
      new DateEpoch(createdDate),
      undefined,
      new InstallmentsNumber(12)
    )

    billRepository.list.mockResolvedValue([completedInstallmentBill])

    await usecase.execute(user, goal, goalValue, description)

    const callArgs = aiService.generateStructured.mock.calls[0]
    const prompt = callArgs[0]
    
    expect(prompt).toContain('"totalInstallmentValue":0')
  })

  it("should calculate partial values for next months correctly", async () => {
    const createdDate = new Date()
    createdDate.setMonth(createdDate.getMonth() - 2) // Created 2 months ago, 1 month left

    const installmentBill = new Bill(
      Id.generate(),
      userId,
      new Name("Sofa"),
      new MoneyValue(400),
      new DateEpoch(createdDate),
      undefined,
      new InstallmentsNumber(3)
    )

    billRepository.list.mockResolvedValue([installmentBill])

    await usecase.execute(user, goal, goalValue, description)

    const callArgs = aiService.generateStructured.mock.calls[0]
    const prompt = callArgs[0]
    
    // Should have 1 installment left, so it should be in partialValueNextMonth
    expect(prompt).toContain('"partialValueNextMonth":400')
  })

  it("should call AI service with correct prompt structure", async () => {
    billRepository.list.mockResolvedValue([])

    await usecase.execute(user, goal, goalValue, description)

    expect(aiService.generateStructured).toHaveBeenCalled()
    const callArgs = aiService.generateStructured.mock.calls[0]
    const prompt = callArgs[0]
    const schema = callArgs[1]
    
    expect(prompt).toContain("Financial Planning Agent")
    expect(prompt).toContain("John Doe")
    expect(prompt).toContain("Buy a car")
    expect(prompt).toContain("30000")
    expect(prompt).toContain("5000")
    expect(prompt).toContain("Save money to buy a new car")

    expect(schema.title).toBe("planning_generation")
    expect(schema.properties).toHaveProperty("name")
    expect(schema.properties).toHaveProperty("plan")
    expect(schema.properties).toHaveProperty("description")
    expect(schema.required).toEqual(["name", "plan", "description"])
  })

  it("should call AI service without description when not provided", async () => {
    billRepository.list.mockResolvedValue([])

    await usecase.execute(user, goal, goalValue)

    const callArgs = aiService.generateStructured.mock.calls[0]
    const prompt = callArgs[0]
    
    expect(prompt).not.toContain("Save money to buy a new car")
  })

  it("should create planning with AI generated data", async () => {
    billRepository.list.mockResolvedValue([])
    
    const aiResponse = {
      data: {
        name: "Car Savings Plan",
        plan: "Save 10% monthly and reduce expenses",
        description: "Detailed plan to achieve car purchase goal"
      },
      model: "gpt-4"
    }
    aiService.generateStructured.mockResolvedValue(aiResponse)

    const mockPlanning = new Planning(
      Id.generate(),
      userId,
      new Name(aiResponse.data.name),
      goal,
      goalValue,
      new Plan(aiResponse.data.plan),
      new DateEpoch(new Date()),
      new Description(aiResponse.data.description)
    )

    planningRepository.create.mockResolvedValue(mockPlanning)

    const result = await usecase.execute(user, goal, goalValue, description)

    expect(planningRepository.create).toHaveBeenCalled()
    const createdPlanning = planningRepository.create.mock.calls[0][0]
    
    expect(createdPlanning).toBeInstanceOf(Planning)
    expect(createdPlanning.getName().toString()).toBe("Car Savings Plan")
    expect(createdPlanning.getPlan().toString()).toBe("Save 10% monthly and reduce expenses")
    expect(createdPlanning.getDescription()?.toString()).toBe("Detailed plan to achieve car purchase goal")
    expect(createdPlanning.getUserId()).toBe(userId)
    expect(createdPlanning.getGoal()).toBe(goal)
    expect(createdPlanning.getGoalValue()).toBe(goalValue)

    expect(result).toBe(mockPlanning)
  })

  it("should handle DatabaseException when bills not found", async () => {
    billRepository.list.mockRejectedValue(new DatabaseException("Bills not found"))

    await usecase.execute(user, goal, goalValue, description)

    // Should not throw and should use zero summary
    const callArgs = aiService.generateStructured.mock.calls[0]
    const prompt = callArgs[0]
    
    expect(prompt).toContain('"totalBillAmount":0')
  })

  it("should propagate errors from bill repository that are not 'Bills not found'", async () => {
    billRepository.list.mockRejectedValue(new DatabaseException("Database connection error"))

    await expect(
      usecase.execute(user, goal, goalValue, description)
    ).rejects.toThrow(new DatabaseException("Database connection error"))
  })

  it("should propagate errors from AI service", async () => {
    billRepository.list.mockResolvedValue([])
    aiService.generateStructured.mockRejectedValue(new Error("AI service unavailable"))

    await expect(
      usecase.execute(user, goal, goalValue, description)
    ).rejects.toThrow("AI service unavailable")
  })

  it("should propagate errors from planning repository", async () => {
    billRepository.list.mockResolvedValue([])
    aiService.generateStructured.mockResolvedValue({
      data: {
        name: "Plan",
        plan: "Plan details",
        description: "Description"
      },
      model: "gpt-4"
    })
    planningRepository.create.mockRejectedValue(new Error("Database error"))

    await expect(
      usecase.execute(user, goal, goalValue, description)
    ).rejects.toThrow("Database error")
  })

  it("should calculate totalBillAmount correctly with all bill types", async () => {
    const now = new Date()
    
    // Fixed bill
    const fixedBill = new Bill(
      Id.generate(),
      userId,
      new Name("Rent"),
      new MoneyValue(1000),
      new DateEpoch(now)
    )

    // Monthly misc bill (this month)
    const monthlyBill = new Bill(
      Id.generate(),
      userId,
      new Name("Groceries"),
      new MoneyValue(300),
      new DateEpoch(now),
      undefined,
      new InstallmentsNumber(1)
    )

    // Installment bill with 4 months remaining
    const installmentDate = new Date(now)
    installmentDate.setMonth(installmentDate.getMonth() - 2)
    const installmentBill = new Bill(
      Id.generate(),
      userId,
      new Name("Television"),
      new MoneyValue(200),
      new DateEpoch(installmentDate),
      undefined,
      new InstallmentsNumber(6)
    )

    billRepository.list.mockResolvedValue([fixedBill, monthlyBill, installmentBill])

    await usecase.execute(user, goal, goalValue, description)

    const callArgs = aiService.generateStructured.mock.calls[0]
    const prompt = callArgs[0]
    
    // totalValue = 1000 (fixed) + 300 (monthly) + 200 (installment) = 1500
    expect(prompt).toContain('"totalValue":1500')
    expect(prompt).toContain('"totalFixedBillsValue":1000')
    expect(prompt).toContain('"totalMonthlyMiscBillsValue":300')
    expect(prompt).toContain('"totalInstallmentValue":200')
    
    // Should have 4 installments remaining, distributed in next 3 months
    // partialValueNextMonth, 2months, 3months = 200 each
    expect(prompt).toContain('"partialValue3MonthsLater":200')
  })

  it("should not include monthly misc bills from previous months", async () => {
    const previousMonth = new Date()
    previousMonth.setMonth(previousMonth.getMonth() - 1)
    
    const oldMonthlyBill = new Bill(
      Id.generate(),
      userId,
      new Name("Old Groceries"),
      new MoneyValue(400),
      new DateEpoch(previousMonth),
      undefined,
      new InstallmentsNumber(1)
    )

    billRepository.list.mockResolvedValue([oldMonthlyBill])

    await usecase.execute(user, goal, goalValue, description)

    const callArgs = aiService.generateStructured.mock.calls[0]
    const prompt = callArgs[0]
    
    expect(prompt).toContain('"totalMonthlyMiscBillsValue":0')
  })

  it("should correctly categorize installment bills into next month buckets", async () => {
    const now = new Date()
    
    // Bill with exactly 1 installment remaining
    const bill1Date = new Date(now)
    bill1Date.setMonth(bill1Date.getMonth() - 2)
    const bill1 = new Bill(
      Id.generate(),
      userId,
      new Name("Item 1"),
      new MoneyValue(100),
      new DateEpoch(bill1Date),
      undefined,
      new InstallmentsNumber(3) // 2 paid, 1 remaining
    )

    // Bill with exactly 2 installments remaining
    const bill2Date = new Date(now)
    bill2Date.setMonth(bill2Date.getMonth() - 3)
    const bill2 = new Bill(
      Id.generate(),
      userId,
      new Name("Item 2"),
      new MoneyValue(200),
      new DateEpoch(bill2Date),
      undefined,
      new InstallmentsNumber(5) // 3 paid, 2 remaining
    )

    // Bill with 4 installments remaining (>= 3)
    const bill3Date = new Date(now)
    bill3Date.setMonth(bill3Date.getMonth() - 1)
    const bill3 = new Bill(
      Id.generate(),
      userId,
      new Name("Item 3"),
      new MoneyValue(300),
      new DateEpoch(bill3Date),
      undefined,
      new InstallmentsNumber(5) // 1 paid, 4 remaining
    )

    billRepository.list.mockResolvedValue([bill1, bill2, bill3])

    await usecase.execute(user, goal, goalValue, description)

    const callArgs = aiService.generateStructured.mock.calls[0]
    const prompt = callArgs[0]
    
    expect(prompt).toContain('"partialValueNextMonth":100') // bill1
    expect(prompt).toContain('"partialValue2MonthsLater":200') // bill2
    expect(prompt).toContain('"partialValue3MonthsLater":300') // bill3
  })
})

