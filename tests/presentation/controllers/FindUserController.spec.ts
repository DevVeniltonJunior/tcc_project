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

  const makeRequest = (query: any = {}) => ({
    body: {},
    params: {},
    query
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
    const req = makeRequest({ name: "Jane Doe" })

    const result = await FindUserController.handle(req)

    expect(result.statusCode).toBe(200)
    expect(result.data).toEqual(user.toJson())
    expect(usecaseSpy).toHaveBeenCalledWith({ name: "Jane Doe" })
  })

  it("should return 400 if no filters are provided", async () => {
    const req = makeRequest({})

    const result = await FindUserController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "At least one filter must be provided" })
  })

  it("should return 400 if salary is not a number", async () => {
    const req = makeRequest({ salary: "abc" })

    const result = await FindUserController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "Query parameter 'salary' must be a valid number" })
  })

  it("should return 400 if InvalidParam is thrown", async () => {
    usecaseSpy.mockRejectedValueOnce(new InvalidParam("email"))

    const req = makeRequest({ email: "invalid_email" })

    const result = await FindUserController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "email" })
  })

  it("should return 400 if BadRequestError is thrown", async () => {
    usecaseSpy.mockRejectedValueOnce(new BadRequestError("Invalid filter"))

    const req = makeRequest({ id: "wrong-id" })

    const result = await FindUserController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "Invalid filter" })
  })

  it("should return 500 if unexpected error occurs", async () => {
    usecaseSpy.mockRejectedValueOnce(new Error("DB crash"))

    const req = makeRequest({ name: "Jane Doe" })

    const result = await FindUserController.handle(req)

    expect(result.statusCode).toBe(500)
    expect(result.data).toEqual({ error: "DB crash" })
  })
})
