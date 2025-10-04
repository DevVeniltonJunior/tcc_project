import { CreatePasswordController } from "@/presentation/controllers/CreatePasswordController"
import { CreatePassword, FindUser } from "@/domain/usecases"
import { Password, User } from "@/domain/entities"
import { Id, PasswordHash, DateEpoch, Bool, Name, Email, MoneyValue } from "@/domain/valueObjects"
import { PasswordHasher } from "@/infra/utils/PasswordHasher"
import { InvalidParam } from "@/domain/exceptions"
import { BadRequestError, NotFoundError } from "@/presentation/exceptions"

describe("[Controller] CreatePasswordController", () => {
  let usecaseSpy: jest.SpyInstance
  let encryptSpy: jest.SpyInstance
  let userUsecaseSpy: jest.SpyInstance
  let password: Password
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
      new MoneyValue(2500)
    )

    password = new Password(
      Id.generate(),
      Id.generate(),
      new PasswordHash("1995-06-15"),
      new Bool(true),
      new DateEpoch(Date.now())
    )

    usecaseSpy = jest.spyOn(CreatePassword.prototype, "execute")
    userUsecaseSpy = jest.spyOn(FindUser.prototype, "execute")
    encryptSpy = jest.spyOn(PasswordHasher, "encrypt")
  })

  it("should create a Password successfully", async () => {
    usecaseSpy.mockResolvedValue(password)
    userUsecaseSpy.mockResolvedValue(user)
    encryptSpy.mockResolvedValue("hashed_pass")

    const req = makeRequest({
      userId: password.getUserId().toString(),
      password: "plain123"
    })

    const result = await CreatePasswordController.handle(req)

    expect(result.statusCode).toBe(201)
    expect(encryptSpy).toHaveBeenCalledWith("plain123")
    expect(result.data).toEqual({"message": "Password created successfully"})
    expect(usecaseSpy).toHaveBeenCalled()
  })

  it("should return 400 if required fields are missing", async () => {
    const req = makeRequest({
      password: "invalid@email.com"
    })

    const result = await CreatePasswordController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toHaveProperty("error")
  })

  it("should return 404 if user not exists", async () => {
    const req = makeRequest({
      userId: Id.generate().toString(),
      password: "invalid@email.com"
    })

    const result = await CreatePasswordController.handle(req)

    expect(result.statusCode).toBe(404)
    expect(result.data).toHaveProperty("error")
  })

  it("should return 400 if InvalidParam is thrown", async () => {
    userUsecaseSpy.mockResolvedValue(user)
    usecaseSpy.mockRejectedValueOnce(new InvalidParam("userId"))

    const req = makeRequest({
      userId: 4,
      password: "invalid_email"
    })

    const result = await CreatePasswordController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "4 is invalid" })
  })

  it("should return 500 if an unexpected error occurs", async () => {
    userUsecaseSpy.mockResolvedValue(user)
    usecaseSpy.mockRejectedValueOnce(new Error("DB crash"))

    const req = makeRequest({
      userId: password.getUserId().toString(),
      password: "plain123"
    })

    const result = await CreatePasswordController.handle(req)

    expect(result.statusCode).toBe(500)
    expect(result.data).toEqual({ error: "DB crash" })
  })
})
