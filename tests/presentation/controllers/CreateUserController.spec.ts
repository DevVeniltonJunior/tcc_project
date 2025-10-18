import { CreateUserController } from "@/presentation/controllers/CreateUserController"
import { CreateUser } from "@/domain/usecases"
import { User, Password, Bill, Planning } from "@/domain/entities"
import { Id, Name, DateEpoch, Email, MoneyValue, PasswordHash, Bool } from "@/domain/valueObjects"
import { PasswordHasher } from "@/infra/utils/PasswordHasher"
import { InvalidParam } from "@/domain/exceptions"

describe("[Controller] CreateUserController", () => {
  let usecaseSpy: jest.SpyInstance
  let encryptSpy: jest.SpyInstance
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
      new Password(Id.generate(), Id.generate(), new PasswordHash("hashed_pass"), new Bool(true), new DateEpoch(Date.now())),
      [] as Bill[],
      [] as Planning[],
      new MoneyValue(2500)
    )

    usecaseSpy = jest.spyOn(CreateUser.prototype, "execute")
    encryptSpy = jest.spyOn(PasswordHasher, "encrypt")
  })

  it("should create a user successfully", async () => {
    usecaseSpy.mockResolvedValue(user)

    const req = makeRequest({
      name: "Jane Doe",
      birthdate: "1995-06-15",
      email: "jane_doe@email.com"
    })

    const result = await CreateUserController.handle(req)

    expect(result.statusCode).toBe(201)
    expect(result.data).toEqual(user.toJson())
    expect(usecaseSpy).toHaveBeenCalled()
  })

  it("should create user with password, bills and planning", async () => {
    usecaseSpy.mockResolvedValue(user)
    encryptSpy.mockResolvedValue("hashed_pass")

    const req = makeRequest({
      name: "Jane Doe",
      birthdate: "1995-06-15",
      email: "jane_doe@email.com",
      password: { password: "plain123" },
      bills: [{ name: "Internet", value: 120.25, description: "Net", installmentsNumber: 2 }],
      planning: [{ name: "Car", goal: "Mazda Miata", goalValue: 90000, plan: "Save money" }],
      salary: 2500
    })

    const result = await CreateUserController.handle(req)

    expect(result.statusCode).toBe(201)
    expect(result.data).toEqual(user.toJson())
    expect(encryptSpy).toHaveBeenCalledWith("plain123")
    expect(usecaseSpy).toHaveBeenCalled()
  })

  it("should return 400 if required fields are missing", async () => {
    const req = makeRequest({
      email: "invalid@email.com"
      // missing name and birthdate
    })

    const result = await CreateUserController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toHaveProperty("error")
  })

  it("should return 400 if InvalidParam is thrown", async () => {
    usecaseSpy.mockRejectedValueOnce(new InvalidParam("email"))

    const req = makeRequest({
      name: "Jane Doe",
      birthdate: "1995-06-15",
      email: "invalid_email"
    })

    const result = await CreateUserController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "invalid_email is invalid" })
  })

  it("should return 500 if an unexpected error occurs", async () => {
    usecaseSpy.mockRejectedValueOnce(new Error("DB crash"))

    const req = makeRequest({
      name: "Jane Doe",
      birthdate: "1995-06-15",
      email: "jane_doe@email.com"
    })

    const result = await CreateUserController.handle(req)

    expect(result.statusCode).toBe(500)
    expect(result.data).toEqual({ error: "DB crash" })
  })
})
