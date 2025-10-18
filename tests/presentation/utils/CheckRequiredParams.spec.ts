import { validateRequiredFields } from "@/presentation/utils"
import { BadRequestError } from "@/presentation/exceptions"

interface User {
  id: string
  name: string
  age?: number
}

describe("[Utils] validateRequiredFields", () => {
  it("Should not throw if all required fields are present", () => {
    const obj: Partial<User> = { id: "123", name: "John" }

    expect(() =>
      validateRequiredFields<User>(obj, ["id", "name"])
    ).not.toThrow()
  })

  it("Should throw BadRequestError if a required field is missing", () => {
    const obj: Partial<User> = { name: "John" } // faltando id

    expect(() =>
      validateRequiredFields<User>(obj, ["id", "name"])
    ).toThrow(BadRequestError)

    expect(() =>
      validateRequiredFields<User>(obj, ["id", "name"])
    ).toThrow("Missing required parameter: id")
  })

  it("Should throw BadRequestError if a required field is null", () => {
    const obj: Partial<User> = { id: null as any, name: "John" }

    expect(() =>
      validateRequiredFields<User>(obj, ["id", "name"])
    ).toThrow(BadRequestError)
  })

  it("Should throw BadRequestError if a required field is undefined", () => {
    const obj: Partial<User> = { id: undefined as any, name: "John" }

    expect(() =>
      validateRequiredFields<User>(obj, ["id", "name"])
    ).toThrow(BadRequestError)
  })
})
