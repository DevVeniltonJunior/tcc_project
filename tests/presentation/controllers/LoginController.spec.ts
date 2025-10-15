import { LoginController } from "@/presentation/controllers/LoginController"
import { Login } from "@/domain/usecases/auth/Login"
import { User, Password } from "@/domain/entities"
import { Id, Name, DateEpoch, Email, MoneyValue, PasswordHash, Bool } from "@/domain/valueObjects"
import { InvalidParam } from "@/domain/exceptions"
import { DatabaseException } from "@/infra/exceptions"

describe("[Controller] LoginController", () => {
  let usecaseSpy: jest.SpyInstance
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

    usecaseSpy = jest.spyOn(Login.prototype, "execute")
  })

  it("should login successfully and return user and token", async () => {
    usecaseSpy.mockResolvedValue({
      user,
      token: "mock_jwt_token_123"
    })

    const req = makeRequest({
      email: "john.doe@email.com",
      password: "SecurePass@123"
    })

    const result = await LoginController.handle(req)

    expect(result.statusCode).toBe(200)
    expect(result.data).toHaveProperty("user")
    expect(result.data).toHaveProperty("token")
    expect((result.data as any).token).toBe("mock_jwt_token_123")
    expect((result.data as any).user).toHaveProperty("id")
    expect((result.data as any).user).toHaveProperty("name", "John Doe")
    expect((result.data as any).user).toHaveProperty("email", "john.doe@email.com")
    expect((result.data as any).user).toHaveProperty("salary", 3500.50)
    expect(usecaseSpy).toHaveBeenCalled()
  })

  it("should login successfully for user without salary", async () => {
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

    usecaseSpy.mockResolvedValue({
      user: userWithoutSalary,
      token: "mock_jwt_token_456"
    })

    const req = makeRequest({
      email: "jane.doe@email.com",
      password: "AnotherPass@456"
    })

    const result = await LoginController.handle(req)

    expect(result.statusCode).toBe(200)
    expect(result.data).toHaveProperty("user")
    expect(result.data).toHaveProperty("token")
    expect((result.data as any).user.salary).toBeUndefined()
  })

  it("should return 400 if email is missing", async () => {
    const req = makeRequest({
      password: "SecurePass@123"
      // missing email
    })

    const result = await LoginController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toHaveProperty("error")
  })

  it("should return 400 if password is missing", async () => {
    const req = makeRequest({
      email: "john.doe@email.com"
      // missing password
    })

    const result = await LoginController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toHaveProperty("error")
  })

  it("should return 400 if all required fields are missing", async () => {
    const req = makeRequest({})

    const result = await LoginController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toHaveProperty("error")
  })

  it("should return 400 if email is invalid (InvalidParam)", async () => {
    usecaseSpy.mockRejectedValueOnce(new InvalidParam("invalid_email is invalid"))

    const req = makeRequest({
      email: "invalid_email",
      password: "SecurePass@123"
    })

    const result = await LoginController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "invalid_email is invalid" })
  })

  it("should return 404 if user is not found", async () => {
    usecaseSpy.mockRejectedValueOnce(new DatabaseException("User not found"))

    const req = makeRequest({
      email: "nonexistent@email.com",
      password: "SecurePass@123"
    })

    const result = await LoginController.handle(req)

    expect(result.statusCode).toBe(404)
    expect(result.data).toEqual({ error: "User not found" })
  })

  it("should return 401 if credentials are invalid", async () => {
    usecaseSpy.mockRejectedValueOnce(new Error("Invalid credentials"))

    const req = makeRequest({
      email: "john.doe@email.com",
      password: "WrongPassword"
    })

    const result = await LoginController.handle(req)

    expect(result.statusCode).toBe(401)
    expect(result.data).toEqual({ error: "Invalid credentials" })
  })

  it("should return 500 if an unexpected error occurs", async () => {
    usecaseSpy.mockRejectedValueOnce(new Error("Database connection failed"))

    const req = makeRequest({
      email: "john.doe@email.com",
      password: "SecurePass@123"
    })

    const result = await LoginController.handle(req)

    expect(result.statusCode).toBe(500)
    expect(result.data).toEqual({ error: "Database connection failed" })
  })

  it("should call Login usecase with correct parameters", async () => {
    usecaseSpy.mockResolvedValue({
      user,
      token: "mock_jwt_token_123"
    })

    const req = makeRequest({
      email: "john.doe@email.com",
      password: "SecurePass@123"
    })

    await LoginController.handle(req)

    expect(usecaseSpy).toHaveBeenCalledTimes(1)
    expect(usecaseSpy).toHaveBeenCalledWith(
      expect.any(Email),
      "SecurePass@123"
    )
  })
})

