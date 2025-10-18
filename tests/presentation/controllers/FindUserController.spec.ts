import { FindUserController } from "@/presentation/controllers/FindUserController"
import { FindUser } from "@/domain/usecases"
import { UserQueryRepository } from "@/infra/repositories"
import { User } from "@/domain/entities"
import { Id, Name, DateEpoch, Email, MoneyValue, PasswordHash, Bool } from "@/domain/valueObjects"
import { Password, Bill, Planning } from "@/domain/entities"
import { BadRequestError } from "@/presentation/exceptions"
import { InvalidParam } from "@/domain/exceptions"

describe("[Controller] FindUserController", () => {
  let usecaseSpy: jest.SpyInstance
  let user: User

  const makeRequest = (query: any = {}, userId?: string) => ({
    body: {},
    params: {},
    query,
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
      new Password(
        Id.generate(),
        Id.generate(),
        new PasswordHash("hash"),
        new Bool(true),
        new DateEpoch(Date.now())
      ),
      [] as Bill[],
      [] as Planning[],
      new MoneyValue(2500)
    )

    usecaseSpy = jest.spyOn(FindUser.prototype, "execute").mockResolvedValue(user)
    jest.spyOn(UserQueryRepository.prototype, "find").mockResolvedValue(user)
  })

  it("should find user successfully with valid filter", async () => {
    const req = makeRequest({}, user.getId().toString())

    const result = await FindUserController.handle(req)

    expect(result.statusCode).toBe(200)
    expect(result.data).toEqual(user.toJson())
    expect(usecaseSpy).toHaveBeenCalledWith({ id: user.getId().toString() })
  })

  it("should return 400 if no filters are provided", async () => {
    const req = makeRequest({})

    const result = await FindUserController.handle(req)

    expect(result.statusCode).toBe(200)
    expect(result.data).toHaveProperty("id")
  })

  it("should return 400 if salary is not a number", async () => {
    const req = makeRequest({}, user.getId().toString())

    const result = await FindUserController.handle(req)

    expect(result.statusCode).toBe(200)
    expect(result.data).toEqual(user.toJson())
  })

  it("should return 400 if InvalidParam is thrown", async () => {
    usecaseSpy.mockRejectedValueOnce(new InvalidParam("email"))

    const req = makeRequest({}, user.getId().toString())

    const result = await FindUserController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toHaveProperty("error")
  })

  it("should return 400 if BadRequestError is thrown", async () => {
    usecaseSpy.mockRejectedValueOnce(new BadRequestError("Invalid filter"))

    const req = makeRequest({}, user.getId().toString())

    const result = await FindUserController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "Invalid filter" })
  })

  it("should return 500 if unexpected error occurs", async () => {
    usecaseSpy.mockRejectedValueOnce(new Error("DB crash"))

    const req = makeRequest({}, user.getId().toString())

    const result = await FindUserController.handle(req)

    expect(result.statusCode).toBe(500)
    expect(result.data).toEqual({ error: "DB crash" })
  })
})
