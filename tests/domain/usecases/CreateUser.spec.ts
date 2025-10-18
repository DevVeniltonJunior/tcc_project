import { CreateUser } from "@/domain/usecases"
import { User, Password, Bill, Planning } from "@/domain/entities"
import { IUserCommandRepository } from "@/domain/protocols"
import { Id, Name, DateEpoch, Email, MoneyValue, PasswordHash, Bool } from "@/domain/valueObjects"
import { UserDTO } from "../dtos"

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

describe("[Usecases] CreateUser", () => {
  let repository: UserCommandRepositoryStub
  let createUser: CreateUser
  let user: User

  beforeEach(() => {
    repository = new UserCommandRepositoryStub()

    createUser = new CreateUser(repository)

    const user_id = Id.generate()

    user = new User(
      user_id,
      new Name("John Doe"),
      new DateEpoch(Date.now()),
      new Email("john@example.com"),
      new DateEpoch(Date.now()),
      new Password(Id.generate(), user_id, new PasswordHash("sha"), new Bool(true), new DateEpoch(Date.now())),
      [] as Bill[],
      [] as Planning[],
      new MoneyValue(5000),
      undefined,
      undefined
    )
  })

  it("should call repository.create with the correct User entity", async () => {
    repository.create.mockResolvedValue(user)

    const result = await createUser.execute(user)

    // Verify that repository.create was called with the User entity
    expect(repository.create).toHaveBeenCalledWith(user)

    // Verify that the result is the same User returned by the repository
    expect(result).toBe(user)
  })

  it("should propagate errors thrown by the repository", async () => {
    repository.create.mockRejectedValue(new Error("DB error"))

    await expect(createUser.execute(user)).rejects.toThrow("DB error")
  })
})
