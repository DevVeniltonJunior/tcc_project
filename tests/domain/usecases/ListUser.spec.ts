import { ListUser } from "@/domain/usecases"
import { User, Password, Bill, Planning } from "@/domain/entities"
import { IUserQueryRepository, TFilter, TUser } from "@/domain/protocols"
import { Id, Name, DateEpoch, Email, MoneyValue, PasswordHash, Bool } from "@/domain/valueObjects"

describe("[Usecases] ListUser", () => {
  let repository: jest.Mocked<IUserQueryRepository>
  let usecase: ListUser
  let users: User[]

  beforeEach(() => {
    repository = {
      list: jest.fn()
    } as unknown as jest.Mocked<IUserQueryRepository>

    usecase = new ListUser(repository)

    users = [
      new User(
        Id.generate(),
        new Name("John Doe"),
        new DateEpoch(Date.now()),
        new Email("john@example.com"),
        new DateEpoch(Date.now()),
        new Password(Id.generate(), Id.generate(), new PasswordHash("sha"), new Bool(true), new DateEpoch(Date.now())),
        [] as Bill[],
        [] as Planning[],
        new MoneyValue(5000)
      ),
      new User(
        Id.generate(),
        new Name("Jane Doe"),
        new DateEpoch(Date.now()),
        new Email("jane@example.com"),
        new DateEpoch(Date.now()),
        new Password(Id.generate(), Id.generate(), new PasswordHash("sha"), new Bool(true), new DateEpoch(Date.now())),
        [] as Bill[],
        [] as Planning[],
        new MoneyValue(6000)
      )
    ]
  })

  it("should return all users when no filter is provided", async () => {
    repository.list.mockResolvedValue(users)

    const result = await usecase.execute()

    expect(repository.list).toHaveBeenCalled()
    expect(result).toEqual(users)
  })

  it("should return all users when a filter is provided (currently ignored)", async () => {
    repository.list.mockResolvedValue(users)
    const filter: TFilter<TUser.Model> = { name: "John Doe" }

    const result = await usecase.execute(filter)

    expect(repository.list).toHaveBeenCalled()
    expect(result).toEqual(users)
  })

  it("should propagate errors from the repository", async () => {
    repository.list.mockRejectedValue(new Error("DB error"))

    await expect(usecase.execute()).rejects.toThrow("DB error")
  })
})
