import { DeleteUserController } from "@/presentation/controllers/DeleteUserController"
import { DeleteUser, FindUser } from "@/domain/usecases"
import { UserCommandRepository } from "@/infra/repositories"
import { BadRequestError } from "@/presentation/exceptions"
import { InvalidParam } from "@/domain/exceptions"
import { Bool, DateEpoch, Email, Id, MoneyValue, Name } from "@/domain/valueObjects"
import { User } from "@/domain/entities"

describe("[Controller] DeleteUserController", () => {
  let usecaseSpy: jest.SpyInstance
  let queryUsecaseSpy: jest.SpyInstance
  let user: User

  const makeRequest = (params: any = {}, query: any = {}) => ({
    body: {},
    params,
    query
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
    usecaseSpy = jest.spyOn(DeleteUser.prototype, "execute").mockResolvedValue(undefined)
    jest.spyOn(UserCommandRepository.prototype, "softDelete").mockResolvedValue(undefined)
    jest.spyOn(UserCommandRepository.prototype, "hardDelete").mockResolvedValue(undefined)
  })

  it("should delete user successfully (soft delete by default)", async () => {
    queryUsecaseSpy.mockResolvedValue(user)

    const userId = Id.generate()
    const req = makeRequest({ id: userId.toString() })

    const result = await DeleteUserController.handle(req)

    expect(result.statusCode).toBe(200)
    expect(result.data).toEqual({ message: "User deleted successfully" })
    expect(usecaseSpy).toHaveBeenCalledWith(userId, new Bool(false))
  })

  it("should delete user permanently if query.permanent=true", async () => {
    queryUsecaseSpy.mockResolvedValue(user)

    const userId = Id.generate()
    const req = makeRequest({ id: userId.toString() }, { permanent: "true" })

    const result = await DeleteUserController.handle(req)

    expect(result.statusCode).toBe(200)
    expect(result.data).toEqual({ message: "User deleted successfully" })
    expect(usecaseSpy).toHaveBeenCalledWith(userId, new Bool(true))
  })

  it("should return 400 if id is missing", async () => {
    queryUsecaseSpy.mockResolvedValue(user)

    const req = makeRequest({}, { permanent: "true" })

    const result = await DeleteUserController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "Mising required parameter: Id" })
  })

  it("should return 400 if InvalidParam is thrown", async () => {
    queryUsecaseSpy.mockResolvedValue(user)

    usecaseSpy.mockRejectedValueOnce(new InvalidParam("id"))

    const userId = Id.generate()
    const req = makeRequest({ id: userId.toString() })

    const result = await DeleteUserController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "id" })
  })

  it("should return 404 if user not exists", async () => {
      const req = makeRequest({
        id: Id.generate().toString(),
        name: "Internet"
      })
  
      const result = await DeleteUserController.handle(req)
  
      expect(result.statusCode).toBe(404)
      expect(result.data).toHaveProperty("error")
    })

  it("should return 500 if unexpected error occurs", async () => {
    queryUsecaseSpy.mockResolvedValue(user)

    usecaseSpy.mockRejectedValueOnce(new Error("Database crash"))

    const userId = Id.generate()
    const req = makeRequest({ id: userId.toString() })

    const result = await DeleteUserController.handle(req)

    expect(result.statusCode).toBe(500)
    expect(result.data).toEqual({ error: "Database crash" })
  })
})
