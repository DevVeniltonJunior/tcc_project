import { CreatePlanningController } from "@/presentation/controllers"
import { CreatePlanning, FindUser } from "@/domain/usecases"
import { Planning, User } from "@/domain/entities"
import { Id, DateEpoch, Name, Email, MoneyValue, Description, InstallmentsNumber, Goal, Plan } from "@/domain/valueObjects"
import { InvalidParam } from "@/domain/exceptions"
import { BadRequestError, NotFoundError } from "@/presentation/exceptions"

describe("[Controller] CreatePlanningController", () => {
  let usecaseSpy: jest.SpyInstance
  let userUsecaseSpy: jest.SpyInstance
  let planning: Planning
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

    planning = new Planning(
      Id.generate(),
      Id.generate(),
      new Name("Car"),
      new Goal("Mazda Miata"),
      new MoneyValue(90000.00),
      new Plan("Save money"),
      new DateEpoch(Date.now()),
      new Description("Buy a car")
    )

    usecaseSpy = jest.spyOn(CreatePlanning.prototype, "execute")
    userUsecaseSpy = jest.spyOn(FindUser.prototype, "execute")
  })

  it("should create a Planning successfully", async () => {
    usecaseSpy.mockResolvedValue(planning)
    userUsecaseSpy.mockResolvedValue(user)

    const req = makeRequest({
      name: "Buy a car",
      goal: "Mazda Miata",
      goalValue: 90000.00,
      plan: "Save money"
    }, planning.getUserId().toString())

    const result = await CreatePlanningController.handle(req)

    expect(result.statusCode).toBe(201)
    expect(result.data).toEqual(planning.toJson())
    expect(usecaseSpy).toHaveBeenCalled()
  })

  it("should return 400 if required fields are missing", async () => {
    userUsecaseSpy.mockResolvedValue(user)
    usecaseSpy.mockResolvedValue(planning)
    
    const req = makeRequest({
      name: "Buy a car",
      goal: "Mazda Miata",
      goalValue: 90000.00,
      plan: "Save money"
    }, user.getId().toString())

    const result = await CreatePlanningController.handle(req)

    expect(result.statusCode).toBe(201)
    expect(result.data).toHaveProperty("id")
  })

  it("should return 404 if user not exists", async () => {
    const req = makeRequest({
      name: "Buy a car",
      goal: "Mazda Miata",
      goalValue: 90000.00,
      plan: "Save money"
    }, planning.getUserId().toString())

    const result = await CreatePlanningController.handle(req)

    expect(result.statusCode).toBe(404)
    expect(result.data).toHaveProperty("error")
  })

  it("should return 400 if InvalidParam is thrown", async () => {
    userUsecaseSpy.mockResolvedValue(user)
    usecaseSpy.mockRejectedValueOnce(new InvalidParam("goal"))

    const req = makeRequest({
      name: "Buy a car",
      goal: "Mazda Miata",
      goalValue: 90000.00,
      plan: "Save money"
    }, user.getId().toString())

    const result = await CreatePlanningController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toHaveProperty("error")
  })

  it("should return 500 if an unexpected error occurs", async () => {
    userUsecaseSpy.mockResolvedValue(user)
    usecaseSpy.mockRejectedValueOnce(new Error("DB crash"))

    const req = makeRequest({
      name: "Buy a car",
      goal: "Mazda Miata",
      goalValue: 90000.00,
      plan: "Save money"
    }, planning.getUserId().toString())

    const result = await CreatePlanningController.handle(req)

    expect(result.statusCode).toBe(500)
    expect(result.data).toEqual({ error: "DB crash" })
  })
})
