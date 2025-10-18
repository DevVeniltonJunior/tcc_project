import { CreatePassword } from "@/domain/usecases"
import { Password } from "@/domain/entities"
import { IPasswordCommandRepository } from "@/domain/protocols"
import { Id, Name, DateEpoch, MoneyValue, PasswordHash, Bool } from "@/domain/valueObjects"

export class PasswordCommandRepositoryStub implements IPasswordCommandRepository {
  // Use jest.fn so we can spy/assert calls
  public create = jest.fn<Promise<Password>, [Password]>(async (entity: Password) => {
    return entity
  })

  public deactivate = jest.fn<Promise<void>, [Id]>(async (_id: Id) => {
    return
  })
}

describe("[Usecases] CreatePassword", () => {
  let repository: PasswordCommandRepositoryStub
  let usecase: CreatePassword
  let password: Password

  beforeEach(() => {
    repository = new PasswordCommandRepositoryStub()

    usecase = new CreatePassword(repository)

    password = new Password(
      Id.generate(),
      Id.generate(),
      new PasswordHash("John Doe"),
      new Bool(true),
      new DateEpoch(Date.now())
    )
  })

  it("should call repository.create with the correct Password entity", async () => {
    repository.create.mockResolvedValue(password)

    const result = await usecase.execute(password)

    // Verify that repository.create was called with the Password entity
    expect(repository.create).toHaveBeenCalledWith(password)

    // Verify that the result is the same Password returned by the repository
    expect(result).toBe(password)
  })

  it("should propagate errors thrown by the repository", async () => {
    repository.create.mockRejectedValue(new Error("DB error"))

    await expect(usecase.execute(password)).rejects.toThrow("DB error")
  })
})
