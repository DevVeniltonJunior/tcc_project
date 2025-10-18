import { UpdateUserController } from "@/presentation/controllers/UpdateUserController"
import { FindUser, UpdateUser } from "@/domain/usecases"
import { UserCommandRepository } from "@/infra/repositories"
import { InvalidParam } from "@/domain/exceptions"
import { BadRequestError } from "@/presentation/exceptions"
import { DateEpoch, Email, Id, MoneyValue, Name } from "@/domain/valueObjects"
import { User } from "@/domain/entities"

describe("[Controller] UpdateUserController", () => {
  let usecaseSpy: jest.SpyInstance
  let queryUsecaseSpy: jest.SpyInstance
  let user: User

  const makeRequest = (body: any = {}) => ({
    body,
    params: {},
    query: {}
  })

  beforeEach(() => {
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

    jest.restoreAllMocks()
    queryUsecaseSpy = jest.spyOn(FindUser.prototype, "execute")
    usecaseSpy = jest.spyOn(UpdateUser.prototype, "execute").mockResolvedValue(undefined)
    // Evita instância real de repositório
    jest.spyOn(UserCommandRepository.prototype, "update").mockResolvedValue(undefined)
  })

  it("should update user successfully", async () => {
    queryUsecaseSpy.mockResolvedValue(user)

    const req = makeRequest({
      id: Id.generate(),
      name: "Jane Doe",
      email: "jane_doe@email.com",
      birthdate: "1995-06-15",
      salary: 3000
    })

    const result = await UpdateUserController.handle(req)

    expect(result.statusCode).toBe(200)
    expect(result.data).toEqual({ message: "User updated successfully" })
    expect(usecaseSpy).toHaveBeenCalled()
  })

  it("should return 400 if required field id is missing", async () => {
    queryUsecaseSpy.mockResolvedValue(user)

    const req = makeRequest({
      name: "Jane Doe"
    })

    const result = await UpdateUserController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toHaveProperty("error")
    expect(result.data.error).toMatch(/id/i)
  })

  it("should return 400 if InvalidParam is thrown", async () => {
    queryUsecaseSpy.mockResolvedValue(user)

    usecaseSpy.mockRejectedValueOnce(new InvalidParam("email"))

    const req = makeRequest({
      id: Id.generate(),
      email: "invalid_email"
    })

    const result = await UpdateUserController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "invalid_email is invalid" })
  })

  it("should return 400 if BadRequestError is thrown", async () => {
    queryUsecaseSpy.mockResolvedValue(user)

    usecaseSpy.mockRejectedValueOnce(new BadRequestError("Invalid data"))

    const req = makeRequest({
      id: Id.generate(),
      salary: -100
    })

    const result = await UpdateUserController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "-100 is invalid" })
  })

  it("should return 404 if user not exists", async () => {
    const req = makeRequest({
      id: Id.generate().toString(),
      name: "Internet"
    })

    const result = await UpdateUserController.handle(req)

    expect(result.statusCode).toBe(404)
    expect(result.data).toHaveProperty("error")
  })

  it("should return 500 if unexpected error is thrown", async () => {
    queryUsecaseSpy.mockResolvedValue(user)

    usecaseSpy.mockRejectedValueOnce(new Error("Database crash"))

    const req = makeRequest({
      id: Id.generate().toString(),
      name: "Jane Doe"
    })

    const result = await UpdateUserController.handle(req)

    expect(result.statusCode).toBe(500)
    expect(result.data).toEqual({ error: "Database crash" })
  })
})
