import { ResetPassword } from "@/domain/usecases"
import { Password } from "@/domain/entities"
import { IPasswordCommandRepository } from "@/domain/protocols"
import { Id, PasswordHash, Bool, DateEpoch } from "@/domain/valueObjects"

describe("ResetPassword UseCase", () => {
  let repository: jest.Mocked<IPasswordCommandRepository>
  let resetPassword: ResetPassword
  let oldPassword: Password
  let newPassword: Password

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      deactivate: jest.fn()
    } as unknown as jest.Mocked<IPasswordCommandRepository>

    resetPassword = new ResetPassword(repository)

    oldPassword = new Password(
      Id.generate(),
      Id.generate(),
      new PasswordHash("John Doe"),
      new Bool(true),
      new DateEpoch(Date.now())
    )
    newPassword = new Password(
      Id.generate(),
      Id.generate(),
      new PasswordHash("Jane Doe"),
      new Bool(true),
      new DateEpoch(Date.now())
    )
  })

  it("should deactivate the old password and create the new one", async () => {
    repository.create.mockResolvedValue(newPassword)

    const result = await resetPassword.execute(newPassword, oldPassword)

    expect(repository.deactivate).toHaveBeenCalledWith(oldPassword.getId())
    expect(repository.create).toHaveBeenCalledWith(newPassword)
    expect(result).toBe(newPassword)
  })

  it("should propagate errors if deactivate fails", async () => {
    repository.deactivate.mockRejectedValue(new Error("Deactivate error"))

    await expect(resetPassword.execute(newPassword, oldPassword)).rejects.toThrow("Deactivate error")
  })

  it("should propagate errors if create fails", async () => {
    repository.create.mockRejectedValue(new Error("Create error"))

    await expect(resetPassword.execute(newPassword, oldPassword)).rejects.toThrow("Create error")
  })
})
