import { UpdatePlanningController } from "@/presentation/controllers/UpdatePlanningController"
import { FindPlanning, UpdatePlanning } from "@/domain/usecases"
import { PlanningCommandRepository } from "@/infra/repositories"
import { InvalidParam } from "@/domain/exceptions"
import { BadRequestError } from "@/presentation/exceptions"
import { DateEpoch, Description, Email, Goal, Id, MoneyValue, Name, Plan } from "@/domain/valueObjects"
import { Planning, User } from "@/domain/entities"

describe("[Controller] UpdatePlanningController", () => {
  let usecaseSpy: jest.SpyInstance
  let queryUsecaseSpy: jest.SpyInstance
  let user: User
  let planning: Planning

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
      user.getId(),
      new Name("Car"),
      new Goal("Mazda Miata"),
      new MoneyValue(90000.00),
      new Plan("Save money"),
      new DateEpoch(Date.now()),
      new Description("Buy a car")
    )

    queryUsecaseSpy = jest.spyOn(FindPlanning.prototype, "execute")
    usecaseSpy = jest.spyOn(UpdatePlanning.prototype, "execute").mockResolvedValue(undefined)
    // Evita instância real de repositório
    jest.spyOn(PlanningCommandRepository.prototype, "update").mockResolvedValue(undefined)
  })

  it("should update Planning successfully", async () => {
    queryUsecaseSpy.mockResolvedValue(planning)

    const req = makeRequest({
      id: planning.getId().toString(),
      name: "Updated Car"
    }, user.getId().toString())

    const result = await UpdatePlanningController.handle(req)

    expect(result.statusCode).toBe(200)
    expect(result.data).toEqual({ message: "Planning updated successfully" })
    expect(usecaseSpy).toHaveBeenCalled()
  })

  it("should return 400 if required field id is missing", async () => {
    queryUsecaseSpy.mockResolvedValue(planning)

    const req = makeRequest({
      name: "Updated Car"
    }, user.getId().toString())

    const result = await UpdatePlanningController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toHaveProperty("error")
    expect(result.data.error).toMatch(/id/i)
  })

  it("should return 400 if InvalidParam is thrown", async () => {
    usecaseSpy.mockRejectedValueOnce(new InvalidParam("email"))
    queryUsecaseSpy.mockResolvedValue(planning)

    const req = makeRequest({
      id: 4,
      name: "Updated Car"
    }, user.getId().toString())

    const result = await UpdatePlanningController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "4 is invalid" })
  })

  it("should return 400 if BadRequestError is thrown", async () => {
    usecaseSpy.mockRejectedValueOnce(new BadRequestError("Invalid data"))
    queryUsecaseSpy.mockResolvedValue(planning)

    const req = makeRequest({
      id: planning.getId().toString(),
      goalValue: 100
    }, user.getId().toString())

    const result = await UpdatePlanningController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "Invalid data" })
  })

  it("should return 404 if user not exists", async () => {
    const req = makeRequest({
      id: Id.generate().toString(),
      name: "Internet"
    }, user.getId().toString())

    const result = await UpdatePlanningController.handle(req)

    expect(result.statusCode).toBe(404)
    expect(result.data).toHaveProperty("error")
  })

  it("should return 500 if unexpected error is thrown", async () => {
    queryUsecaseSpy.mockResolvedValue(planning)
    usecaseSpy.mockRejectedValueOnce(new Error("Database crash"))

    const req = makeRequest({
      id: planning.getId().toString(),
      name: "Updated Car"
    }, user.getId().toString())

    const result = await UpdatePlanningController.handle(req)

    expect(result.statusCode).toBe(500)
    expect(result.data).toEqual({ error: "Database crash" })
  })
})
