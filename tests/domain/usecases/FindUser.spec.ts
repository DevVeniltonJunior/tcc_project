import { FindUser } from "@/domain/usecases"
import { User, Password, Bill, Planning } from "@/domain/entities"
import { IUserQueryRepository, TFilter, TUser } from "@/domain/protocols"
import { Id, Name, DateEpoch, Email, MoneyValue, PasswordHash, Bool } from "@/domain/valueObjects"

describe("[Usecases] FindUser", () => {
  let repository: jest.Mocked<IUserQueryRepository>
  let usecase: FindUser
  let user: User

  beforeEach(() => {
    repository = {
      find: jest.fn()
    } as unknown as jest.Mocked<IUserQueryRepository>

    usecase = new FindUser(repository)

    user = new User(
        Id.generate(),
        new Name("John Doe"),
        new DateEpoch(Date.now()),
        new Email("john@example.com"),
        new DateEpoch(Date.now()),
        new Password(Id.generate(), Id.generate(), new PasswordHash("sha"), new Bool(true), new DateEpoch(Date.now())),
        [] as Bill[],
        [] as Planning[],
        new MoneyValue(5000)
      )
  })

  it("should throw an error when no filter is provided", async () => {
    await expect(usecase.execute()).rejects.toThrow("At least one filter must be provided")
  })

  it("should return all users when a filter is provided (currently ignored)", async () => {
    repository.find.mockResolvedValue(user)
    const filter: TFilter<TUser.Model> = { name: "John Doe" }

    const result = await usecase.execute(filter)

    expect(repository.find).toHaveBeenCalled()
    expect(result).toEqual(user)
  })

  it("should propagate errors from the repository", async () => {
    repository.find.mockRejectedValue(new Error("DB error"))

    await expect(usecase.execute({name: "Renato"})).rejects.toThrow("DB error")
  })
})
