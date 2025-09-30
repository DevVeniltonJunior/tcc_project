import { DeleteUser } from "@/domain/usecases"
import { User } from "@/domain/entities"
import { IUserCommandRepository } from "@/domain/protocols"
import { Bool, Id } from "@/domain/valueObjects"
import { UserDTO } from "@/domain/dtos"

export class UserCommandRepositoryStub implements IUserCommandRepository {
  // Use jest.fn so we can spy/assert calls
  public create = jest.fn<Promise<User>, [User]>(async (entity: User) => {
    return entity
  })

  public update = jest.fn<Promise<void>, [UserDTO]>(async (dto: UserDTO) => {
    return
  })

  public softDelete = jest.fn<Promise<void>, [Id]>(async (_id: Id) => {
    return
  })

  public hardDelete = jest.fn<Promise<void>, [Id]>(async (_id: Id) => {
    return
  })
}

describe("[Usecases] DeleteUser", () => {
  let user_id: Id
  let repository: UserCommandRepositoryStub
  let usecase: DeleteUser

  beforeEach(() => {
    repository = new UserCommandRepositoryStub()

    usecase = new DeleteUser(repository)

    user_id = Id.generate()
  })

  it("should call repository.delete with the correct User dto", async () => {
    const result = await usecase.execute(user_id, new Bool(false))

    // Verify that repository.delete was called with the User dto
    expect(repository.softDelete).toHaveBeenCalledWith(user_id)
  })

  it("should propagate errors thrown by the repository", async () => {
    repository.softDelete.mockRejectedValue(new Error("DB error"))

    await expect(usecase.execute(user_id, new Bool(false))).rejects.toThrow("DB error")
  })
})
