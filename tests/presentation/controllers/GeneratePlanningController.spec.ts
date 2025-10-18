import { GeneratePlanningController } from "@/presentation/controllers"
import { GeneratePlanning, FindUser } from "@/domain/usecases"
import { Planning, User } from "@/domain/entities"
import { Id, DateEpoch, Name, Email, MoneyValue, Description, Goal, Plan } from "@/domain/valueObjects"
import { InvalidParam } from "@/domain/exceptions"
import { BadRequestError, NotFoundError } from "@/presentation/exceptions"

describe("[Controller] GeneratePlanningController", () => {
  let usecaseSpy: jest.SpyInstance
  let userUsecaseSpy: jest.SpyInstance
  let planning: Planning
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
      new MoneyValue(5000)
    )

    planning = new Planning(
      Id.generate(),
      user.getId(),
      new Name("Car Acquisition Plan"),
      new Goal("Mazda Miata"),
      new MoneyValue(90000.00),
      new Plan("Based on your current salary and expenses, save $1,500 monthly. Consider reducing subscription bills to increase savings rate."),
      new DateEpoch(Date.now()),
      new Description("Comprehensive plan to purchase a Mazda Miata within 24 months")
    )

    usecaseSpy = jest.spyOn(GeneratePlanning.prototype, "execute")
    userUsecaseSpy = jest.spyOn(FindUser.prototype, "execute")
  })

  it("should generate a Planning successfully", async () => {
    usecaseSpy.mockResolvedValue(planning)
    userUsecaseSpy.mockResolvedValue(user)

    const req = makeRequest({
      userId: user.getId().toString(),
      goal: "Mazda Miata",
      goalValue: 90000.00,
      description: "Buy a car for work commute"
    })

    const result = await GeneratePlanningController.handle(req)

    expect(result.statusCode).toBe(200)
    expect(result.data).toEqual(planning.toJson())
    expect(usecaseSpy).toHaveBeenCalled()
    expect(userUsecaseSpy).toHaveBeenCalledWith({ id: user.getId().toString() })
  })

  it("should generate a Planning successfully without optional description", async () => {
    usecaseSpy.mockResolvedValue(planning)
    userUsecaseSpy.mockResolvedValue(user)

    const req = makeRequest({
      userId: user.getId().toString(),
      goal: "Mazda Miata",
      goalValue: 90000.00
    })

    const result = await GeneratePlanningController.handle(req)

    expect(result.statusCode).toBe(200)
    expect(result.data).toEqual(planning.toJson())
    expect(usecaseSpy).toHaveBeenCalled()
  })

  it("should return 400 if userId is missing", async () => {
    const req = makeRequest({
      goal: "Mazda Miata",
      goalValue: 90000.00
    })

    const result = await GeneratePlanningController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toHaveProperty("error")
    expect(result.data.error).toContain("userId")
  })

  it("should return 400 if goal is missing", async () => {
    const req = makeRequest({
      userId: user.getId().toString(),
      goalValue: 90000.00
    })

    const result = await GeneratePlanningController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toHaveProperty("error")
    expect(result.data.error).toContain("goal")
  })

  it("should return 400 if goalValue is missing", async () => {
    const req = makeRequest({
      userId: user.getId().toString(),
      goal: "Mazda Miata"
    })

    const result = await GeneratePlanningController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toHaveProperty("error")
    expect(result.data.error).toContain("goalValue")
  })

  it("should return 400 if all required fields are missing", async () => {
    const req = makeRequest({
      description: "Some description"
    })

    const result = await GeneratePlanningController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toHaveProperty("error")
  })

  it("should return 404 if user does not exist", async () => {
    userUsecaseSpy.mockResolvedValue(null)

    const req = makeRequest({
      userId: user.getId().toString(),
      goal: "Mazda Miata",
      goalValue: 90000.00
    })

    const result = await GeneratePlanningController.handle(req)

    expect(result.statusCode).toBe(404)
    expect(result.data).toEqual({ error: "User not found" })
  })

  it("should return 400 if user has no salary", async () => {
    const userWithoutSalary = new User(
      Id.generate(),
      new Name("John Doe"),
      new DateEpoch("1990-01-01"),
      new Email("john_doe@email.com"),
      new DateEpoch(Date.now()),
      undefined,
      undefined,
      undefined,
      undefined
    )

    userUsecaseSpy.mockResolvedValue(userWithoutSalary)

    const req = makeRequest({
      userId: userWithoutSalary.getId().toString(),
      goal: "Mazda Miata",
      goalValue: 90000.00
    })

    const result = await GeneratePlanningController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "User salary not found" })
  })

  it("should return 400 if InvalidParam is thrown for goal", async () => {
    userUsecaseSpy.mockResolvedValue(user)
    usecaseSpy.mockRejectedValueOnce(new InvalidParam("goal"))

    const req = makeRequest({
      userId: user.getId().toString(),
      goal: "",
      goalValue: 90000.00
    })

    const result = await GeneratePlanningController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toHaveProperty("error")
  })

  it("should return 400 if InvalidParam is thrown for goalValue", async () => {
    userUsecaseSpy.mockResolvedValue(user)
    usecaseSpy.mockRejectedValueOnce(new InvalidParam("goalValue"))

    const req = makeRequest({
      userId: user.getId().toString(),
      goal: "Mazda Miata",
      goalValue: -100
    })

    const result = await GeneratePlanningController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toHaveProperty("error")
  })

  it("should return 400 if BadRequestError is thrown", async () => {
    userUsecaseSpy.mockResolvedValue(user)
    usecaseSpy.mockRejectedValueOnce(new BadRequestError("Invalid data"))

    const req = makeRequest({
      userId: user.getId().toString(),
      goal: "Mazda Miata",
      goalValue: 90000.00
    })

    const result = await GeneratePlanningController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "Invalid data" })
  })

  it("should return 500 if an unexpected error occurs during AI generation", async () => {
    userUsecaseSpy.mockResolvedValue(user)
    usecaseSpy.mockRejectedValueOnce(new Error("AI service unavailable"))

    const req = makeRequest({
      userId: user.getId().toString(),
      goal: "Mazda Miata",
      goalValue: 90000.00
    })

    const result = await GeneratePlanningController.handle(req)

    expect(result.statusCode).toBe(500)
    expect(result.data).toEqual({ error: "AI service unavailable" })
  })

  it("should return 500 if database error occurs", async () => {
    userUsecaseSpy.mockResolvedValue(user)
    usecaseSpy.mockRejectedValueOnce(new Error("Database connection failed"))

    const req = makeRequest({
      userId: user.getId().toString(),
      goal: "Mazda Miata",
      goalValue: 90000.00
    })

    const result = await GeneratePlanningController.handle(req)

    expect(result.statusCode).toBe(500)
    expect(result.data).toEqual({ error: "Database connection failed" })
  })

  it("should handle planning generation with description parameter", async () => {
    usecaseSpy.mockResolvedValue(planning)
    userUsecaseSpy.mockResolvedValue(user)

    const req = makeRequest({
      userId: user.getId().toString(),
      goal: "Mazda Miata",
      goalValue: 90000.00,
      description: "Buy a car for weekend trips"
    })

    const result = await GeneratePlanningController.handle(req)

    expect(result.statusCode).toBe(200)
    expect(result.data).toEqual(planning.toJson())
    expect(usecaseSpy).toHaveBeenCalled()
  })

  it("should validate that usecase receives correct parameters", async () => {
    usecaseSpy.mockResolvedValue(planning)
    userUsecaseSpy.mockResolvedValue(user)

    const req = makeRequest({
      userId: user.getId().toString(),
      goal: "Mazda Miata",
      goalValue: 90000.00,
      description: "Test description"
    })

    await GeneratePlanningController.handle(req)

    expect(usecaseSpy).toHaveBeenCalledWith(
      user,
      expect.objectContaining({ value: "Mazda Miata" }),
      expect.objectContaining({ value: 90000.00 }),
      expect.objectContaining({ value: "Test description" })
    )
  })

  it("should pass undefined description when not provided", async () => {
    usecaseSpy.mockResolvedValue(planning)
    userUsecaseSpy.mockResolvedValue(user)

    const req = makeRequest({
      userId: user.getId().toString(),
      goal: "Mazda Miata",
      goalValue: 90000.00
    })

    await GeneratePlanningController.handle(req)

    expect(usecaseSpy).toHaveBeenCalledWith(
      user,
      expect.objectContaining({ value: "Mazda Miata" }),
      expect.objectContaining({ value: 90000.00 }),
      undefined
    )
  })
})

