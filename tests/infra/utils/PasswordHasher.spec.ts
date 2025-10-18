import { PasswordHasher } from "@/infra/utils"
import bcrypt from "bcrypt"
import { ServiceException } from "@/infra/exceptions"

describe("[Utils] PasswordHasher", () => {
  it("Should not throw to hash a password", async () => {
    expect(async () => await PasswordHasher.encrypt("pass")).not.toThrow()
  })

  it("Should not throw to compare a password", async () => {
    const pass = await PasswordHasher.encrypt("Renato")
    expect(async () => PasswordHasher.verifyPassword("Renato", pass)).not.toThrow()
  })

  it("Should throw to hash a password", async () => {
    jest.spyOn(bcrypt, "hash").mockImplementationOnce(() => Promise.reject(new ServiceException("Hash error")))

    await expect(async() => await PasswordHasher.encrypt("Renato")).rejects.toThrow("Hash error")
  })

  it("Should throw to compare a password", async () => {
    const password = await PasswordHasher.encrypt("Renato")
    jest.spyOn(bcrypt, "compare").mockImplementationOnce(() => Promise.reject(new ServiceException("Compare error")))

    await expect(async() => await PasswordHasher.verifyPassword("Renato", password)).rejects.toThrow("Compare error")
  })
})