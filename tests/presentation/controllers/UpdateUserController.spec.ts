import { UpdateUserController } from "@/presentation/controllers/UpdateUserController"
import { UpdateUser } from "@/domain/usecases"
import { UserCommandRepository } from "@/infra/repositories"
import { InvalidParam } from "@/domain/exceptions"
import { BadRequestError } from "@/presentation/exceptions"
import { Id } from "@/domain/valueObjects"

describe("[Controller] UpdateUserController", () => {
  let usecaseSpy: jest.SpyInstance

  const makeRequest = (body: any = {}) => ({
    body,
    params: {},
    query: {}
  })

  beforeEach(() => {
    jest.restoreAllMocks()
    usecaseSpy = jest.spyOn(UpdateUser.prototype, "execute").mockResolvedValue(undefined)
    // Evita instância real de repositório
    jest.spyOn(UserCommandRepository.prototype, "update").mockResolvedValue(undefined)
  })

  it("should update user successfully", async () => {
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
    const req = makeRequest({
      name: "Jane Doe"
    })

    const result = await UpdateUserController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toHaveProperty("error")
    expect(result.data.error).toMatch(/id/i)
  })

  it("should return 400 if InvalidParam is thrown", async () => {
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
    usecaseSpy.mockRejectedValueOnce(new BadRequestError("Invalid data"))

    const req = makeRequest({
      id: Id.generate(),
      salary: -100
    })

    const result = await UpdateUserController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "-100 is invalid" })
  })

  it("should return 500 if unexpected error is thrown", async () => {
    usecaseSpy.mockRejectedValueOnce(new Error("Database crash"))

    const req = makeRequest({
      id: Id.generate(),
      name: "Jane Doe"
    })

    const result = await UpdateUserController.handle(req)

    expect(result.statusCode).toBe(500)
    expect(result.data).toEqual({ error: "Database crash" })
  })
})
