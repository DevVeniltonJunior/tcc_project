import { ListUserController } from "@/presentation/controllers/ListUserController"
import { ListUser } from "@/domain/usecases"
import { UserQueryRepository } from "@/infra/repositories"
import { User, Password, Bill, Planning } from "@/domain/entities"
import { Id, Name, DateEpoch, Email, MoneyValue, PasswordHash, Bool } from "@/domain/valueObjects"
import { BadRequestError } from "@/presentation/exceptions"
import { InvalidParam } from "@/domain/exceptions"

describe("[Controller] ListUserController", () => {
  let usecaseSpy: jest.SpyInstance
  let users: User[]

  const makeRequest = (query: any = {}) => ({
    body: {},
    params: {},
    query
  })

  beforeEach(() => {
    jest.restoreAllMocks()

    const user1 = new User(
      Id.generate(),
      new Name("Jane Doe"),
      new DateEpoch("1995-06-15"),
      new Email("jane_doe@email.com"),
      new DateEpoch(Date.now()),
      new Password(
        Id.generate(),
        Id.generate(),
        new PasswordHash("hash1"),
        new Bool(true),
        new DateEpoch(Date.now())
      ),
      [] as Bill[],
      [] as Planning[],
      new MoneyValue(2500)
    )

    const user2 = new User(
      Id.generate(),
      new Name("John Smith"),
      new DateEpoch("1988-03-10"),
      new Email("john.smith@email.com"),
      new DateEpoch(Date.now()),
      new Password(
        Id.generate(),
        Id.generate(),
        new PasswordHash("hash2"),
        new Bool(true),
        new DateEpoch(Date.now())
      ),
      [] as Bill[],
      [] as Planning[],
      new MoneyValue(4000)
    )

    users = [user1, user2]

    usecaseSpy = jest.spyOn(ListUser.prototype, "execute").mockResolvedValue(users)
    jest.spyOn(UserQueryRepository.prototype, "list").mockResolvedValue(users)
  })

  it("should list users successfully", async () => {
    const req = makeRequest({})

    const result = await ListUserController.handle(req)

    expect(result.statusCode).toBe(200)
    expect(result.data).toEqual(users.map(u => u.toJson()))
    expect(usecaseSpy).toHaveBeenCalledWith({})
  })

  it("should handle query filters", async () => {
    const req = makeRequest({ name: "Jane Doe" })

    const result = await ListUserController.handle(req)

    expect(result.statusCode).toBe(200)
    expect(result.data).toEqual(users.map(u => u.toJson()))
    expect(usecaseSpy).toHaveBeenCalledWith({ name: "Jane Doe" })
  })

  it("should return 400 if salary is not a number", async () => {
    const req = makeRequest({ salary: "invalid" })

    const result = await ListUserController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "Query parameter 'salary' must be a valid number" })
  })

  it("should return 400 if InvalidParam is thrown", async () => {
    usecaseSpy.mockRejectedValueOnce(new InvalidParam("email"))

    const req = makeRequest({ email: "wrong_email" })

    const result = await ListUserController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "email" })
  })

  it("should return 400 if BadRequestError is thrown", async () => {
    usecaseSpy.mockRejectedValueOnce(new BadRequestError("Invalid filter"))

    const req = makeRequest({ id: "bad-id" })

    const result = await ListUserController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "Invalid filter" })
  })

  it("should return 500 if unexpected error occurs", async () => {
    usecaseSpy.mockRejectedValueOnce(new Error("Database crash"))

    const req = makeRequest({})

    const result = await ListUserController.handle(req)

    expect(result.statusCode).toBe(500)
    expect(result.data).toEqual({ error: "Database crash" })
  })
})
