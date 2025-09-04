import { UpdateUser } from "@/domain/usecases"
import { User } from "@/domain/entities"
import { IUserCommandRepository } from "@/domain/protocols"
import { Id, Name, DateEpoch, Email, MoneyValue } from "@/domain/valueObjects"
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

describe("[Usecases] UpdateUser", () => {
  let user_id: Id
  let repository: UserCommandRepositoryStub
  let usecase: UpdateUser
  let user: UserDTO

  beforeEach(() => {
    repository = new UserCommandRepositoryStub()

    usecase = new UpdateUser(repository)

    user_id = Id.generate()

    user = new UserDTO(
      user_id,
      new Name("John Doe"),
      new DateEpoch(Date.now()),
      new Email("john@example.com"),
      new MoneyValue(5000),
      undefined,
      undefined
    )
  })

  it("should call repository.update with the correct User dto", async () => {
    const result = await usecase.execute(user)

    // Verify that repository.update was called with the User dto
    expect(repository.update).toHaveBeenCalledWith(user)
  })

  it("should propagate errors thrown by the repository", async () => {
    repository.update.mockRejectedValue(new Error("DB error"))

    await expect(usecase.execute(user)).rejects.toThrow("DB error")
  })
})
