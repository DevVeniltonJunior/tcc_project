import { RegisterController } from "@/presentation/controllers/RegisterController"
import { CreateUser } from "@/domain/usecases"
import { User, Password } from "@/domain/entities"
import { Id, Name, DateEpoch, Email, MoneyValue, PasswordHash, Bool } from "@/domain/valueObjects"
import { PasswordHasher } from "@/infra/utils/PasswordHasher"
import { TokenService } from "@/infra/utils/TokenService"
import { InvalidParam } from "@/domain/exceptions"

describe("[Controller] RegisterController", () => {
  let usecaseSpy: jest.SpyInstance
  let encryptSpy: jest.SpyInstance
  let tokenServiceSpy: jest.SpyInstance
  let user: User

  const makeRequest = (body: any = {}) => ({
    body,
    params: {},
    query: {}
  })

  beforeEach(() => {
    jest.restoreAllMocks()

    const userId = Id.generate()
    user = new User(
      userId,
      new Name("John Doe"),
      new DateEpoch("1990-05-15"),
      new Email("john.doe@email.com"),
      new DateEpoch(Date.now()),
      new Password(Id.generate(), userId, new PasswordHash("hashed_pass"), new Bool(true), new DateEpoch(Date.now())),
      undefined,
      undefined,
      new MoneyValue(3500.50)
    )

    usecaseSpy = jest.spyOn(CreateUser.prototype, "execute")
    encryptSpy = jest.spyOn(PasswordHasher, "encrypt")
    tokenServiceSpy = jest.spyOn(TokenService.prototype, "generateTokenForUser")
  })

  it("should register a user successfully and return a token", async () => {
    usecaseSpy.mockResolvedValue(user)
    encryptSpy.mockResolvedValue("hashed_pass")
    tokenServiceSpy.mockReturnValue("mock_jwt_token_123")

    const req = makeRequest({
      name: "John Doe",
      email: "john.doe@email.com",
      birthdate: "1990-05-15",
      password: "SecurePass@123",
      salary: 3500.50
    })

    const result = await RegisterController.handle(req)

    expect(result.statusCode).toBe(201)
    expect(result.data).toHaveProperty("user")
    expect(result.data).toHaveProperty("token")
    expect((result.data as any).token).toBe("mock_jwt_token_123")
    expect((result.data as any).user).toHaveProperty("id")
    expect((result.data as any).user).toHaveProperty("name", "John Doe")
    expect((result.data as any).user).toHaveProperty("email", "john.doe@email.com")
    expect(encryptSpy).toHaveBeenCalledWith("SecurePass@123")
    expect(usecaseSpy).toHaveBeenCalled()
    expect(tokenServiceSpy).toHaveBeenCalled()
  })

  it("should register a user without salary", async () => {
    const userWithoutSalary = new User(
      Id.generate(),
      new Name("Jane Doe"),
      new DateEpoch("1995-06-15"),
      new Email("jane.doe@email.com"),
      new DateEpoch(Date.now()),
      new Password(Id.generate(), Id.generate(), new PasswordHash("hashed_pass"), new Bool(true), new DateEpoch(Date.now())),
      undefined,
      undefined,
      undefined
    )

    usecaseSpy.mockResolvedValue(userWithoutSalary)
    encryptSpy.mockResolvedValue("hashed_pass")
    tokenServiceSpy.mockReturnValue("mock_jwt_token_456")

    const req = makeRequest({
      name: "Jane Doe",
      email: "jane.doe@email.com",
      birthdate: "1995-06-15",
      password: "AnotherPass@456"
    })

    const result = await RegisterController.handle(req)

    expect(result.statusCode).toBe(201)
    expect(result.data).toHaveProperty("user")
    expect(result.data).toHaveProperty("token")
    expect((result.data as any).user.salary).toBeUndefined()
  })

  it("should return 400 if required fields are missing", async () => {
    const req = makeRequest({
      email: "test@email.com"
      // missing name, birthdate, and password
    })

    const result = await RegisterController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toHaveProperty("error")
  })

  it("should return 400 if password is missing", async () => {
    const req = makeRequest({
      name: "John Doe",
      email: "john.doe@email.com",
      birthdate: "1990-05-15"
      // missing password
    })

    const result = await RegisterController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toHaveProperty("error")
  })

  it("should return 400 if InvalidParam is thrown", async () => {
    usecaseSpy.mockRejectedValueOnce(new InvalidParam("email"))

    const req = makeRequest({
      name: "John Doe",
      email: "invalid_email",
      birthdate: "1990-05-15",
      password: "SecurePass@123"
    })

    const result = await RegisterController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "invalid_email is invalid" })
  })

  it("should return 500 if an unexpected error occurs", async () => {
    usecaseSpy.mockRejectedValueOnce(new Error("Database connection failed"))

    const req = makeRequest({
      name: "John Doe",
      email: "john.doe@email.com",
      birthdate: "1990-05-15",
      password: "SecurePass@123"
    })

    const result = await RegisterController.handle(req)

    expect(result.statusCode).toBe(500)
    expect(result.data).toEqual({ error: "Database connection failed" })
  })
})


