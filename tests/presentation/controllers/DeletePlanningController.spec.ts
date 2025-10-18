import { DeletePlanningController } from "@/presentation/controllers/DeletePlanningController"
import { DeletePlanning, FindPlanning } from "@/domain/usecases"
import { PlanningCommandRepository } from "@/infra/repositories"
import { BadRequestError } from "@/presentation/exceptions"
import { InvalidParam } from "@/domain/exceptions"
import { Bool, DateEpoch, Description, Goal, Id, MoneyValue, Name, Plan } from "@/domain/valueObjects"
import { Planning } from "@/domain/entities"

describe("[Controller] DeletePlanningController", () => {
  let usecaseSpy: jest.SpyInstance
  let queryUsecaseSpy: jest.SpyInstance
  let planning: Planning

  const makeRequest = (params: any = {}, query: any = {}, userId?: string) => ({
    body: {},
    params,
    query,
    userId: userId || Id.generate().toString()
  })

  beforeEach(() => {
    const userId = Id.generate()
    
    planning = new Planning(
      Id.generate(),
      userId,
      new Name("Car"),
      new Goal("Mazda Miata"),
      new MoneyValue(90000.00),
      new Plan("Save money"),
      new DateEpoch(Date.now()),
      new Description("Buy a car")
    )

    jest.restoreAllMocks()
    queryUsecaseSpy = jest.spyOn(FindPlanning.prototype, "execute")
    usecaseSpy = jest.spyOn(DeletePlanning.prototype, "execute").mockResolvedValue(undefined)
    jest.spyOn(PlanningCommandRepository.prototype, "softDelete").mockResolvedValue(undefined)
    jest.spyOn(PlanningCommandRepository.prototype, "hardDelete").mockResolvedValue(undefined)
  })

  it("should delete Planning successfully (soft delete by default)", async () => {
    queryUsecaseSpy.mockResolvedValue(planning)

    const req = makeRequest({ id: planning.getId().toString() }, {}, planning.getUserId().toString())

    const result = await DeletePlanningController.handle(req)

    expect(result.statusCode).toBe(200)
    expect(result.data).toEqual({ message: "Planning deleted successfully" })
    expect(usecaseSpy).toHaveBeenCalledWith(planning.getId(), new Bool(false))
  })

  it("should delete Planning permanently if query.permanent=true", async () => {
    queryUsecaseSpy.mockResolvedValue(planning)

    const req = makeRequest({ id: planning.getId().toString() }, { permanent: "true" }, planning.getUserId().toString())

    const result = await DeletePlanningController.handle(req)

    expect(result.statusCode).toBe(200)
    expect(result.data).toEqual({ message: "Planning deleted successfully" })
    expect(usecaseSpy).toHaveBeenCalledWith(planning.getId(), new Bool(true))
  })

  it("should return 400 if id is missing", async () => {
    queryUsecaseSpy.mockResolvedValue(planning)

    const req = makeRequest({}, { permanent: "true" })

    const result = await DeletePlanningController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "Mising required parameter: Id" })
  })

  it("should return 400 if InvalidParam is thrown", async () => {
    queryUsecaseSpy.mockResolvedValue(planning)

    usecaseSpy.mockRejectedValueOnce(new InvalidParam("id"))

    const req = makeRequest({ id: planning.getId().toString() }, {}, planning.getUserId().toString())

    const result = await DeletePlanningController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toHaveProperty("error")
    expect(result.data.error).toContain("id")
  })

  it("should return 404 if Planning not exists", async () => {
      const req = makeRequest({
        id: Id.generate().toString(),
        name: "Internet"
      })
  
      const result = await DeletePlanningController.handle(req)
  
      expect(result.statusCode).toBe(404)
      expect(result.data).toHaveProperty("error")
    })

  it("should return 500 if unexpected error occurs", async () => {
    queryUsecaseSpy.mockResolvedValue(planning)

    usecaseSpy.mockRejectedValueOnce(new Error("Database crash"))

    const req = makeRequest({ id: planning.getId().toString() }, {}, planning.getUserId().toString())

    const result = await DeletePlanningController.handle(req)

    expect(result.statusCode).toBe(500)
    expect(result.data).toEqual({ error: "Database crash" })
  })
})
