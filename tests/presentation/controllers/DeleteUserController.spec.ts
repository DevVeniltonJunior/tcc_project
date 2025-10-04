import { DeleteUserController } from "@/presentation/controllers/DeleteUserController"
import { DeleteUser } from "@/domain/usecases"
import { UserCommandRepository } from "@/infra/repositories"
import { BadRequestError } from "@/presentation/exceptions"
import { InvalidParam } from "@/domain/exceptions"
import { Bool, Id } from "@/domain/valueObjects"

describe("[Controller] DeleteUserController", () => {
  let usecaseSpy: jest.SpyInstance

  const makeRequest = (params: any = {}, query: any = {}) => ({
    body: {},
    params,
    query
  })

  beforeEach(() => {
    jest.restoreAllMocks()
    usecaseSpy = jest.spyOn(DeleteUser.prototype, "execute").mockResolvedValue(undefined)
    jest.spyOn(UserCommandRepository.prototype, "softDelete").mockResolvedValue(undefined)
  })

  it("should delete user successfully (soft delete by default)", async () => {
    const userId = Id.generate()
    const req = makeRequest({ id: userId.toString() })

    const result = await DeleteUserController.handle(req)

    expect(result.statusCode).toBe(200)
    expect(result.data).toEqual({ message: "User deleted successfully" })
    expect(usecaseSpy).toHaveBeenCalledWith(userId, new Bool(false))
  })

  it("should delete user permanently if query.permanent=true", async () => {
    const userId = Id.generate()
    const req = makeRequest({ id: userId.toString() }, { permanent: "true" })

    const result = await DeleteUserController.handle(req)

    expect(result.statusCode).toBe(200)
    expect(result.data).toEqual({ message: "User deleted successfully" })
    expect(usecaseSpy).toHaveBeenCalledWith(userId, new Bool(true))
  })

  it("should return 400 if id is missing", async () => {
    const req = makeRequest({}, { permanent: "true" })

    const result = await DeleteUserController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "Mising required parameter: Id" })
  })

  it("should return 400 if InvalidParam is thrown", async () => {
    usecaseSpy.mockRejectedValueOnce(new InvalidParam("id"))

    const userId = Id.generate()
    const req = makeRequest({ id: userId })

    const result = await DeleteUserController.handle(req)

    expect(result.statusCode).toBe(400)
    expect(result.data).toEqual({ error: "id" })
  })

  it("should return 500 if unexpected error occurs", async () => {
    usecaseSpy.mockRejectedValueOnce(new Error("Database crash"))

    const userId = Id.generate()
    const req = makeRequest({ id: userId })

    const result = await DeleteUserController.handle(req)

    expect(result.statusCode).toBe(500)
    expect(result.data).toEqual({ error: "Database crash" })
  })
})
