import { buildWhereInput } from "@/infra/utils"

type User = {
  id: string
  name: string
  age: number
  isActive: boolean
  birthdate: Date | string
  email: string
}

describe("[Utils] BuildWhereInput", () => {
  it("should return empty object if filters are not provided", () => {
    expect(buildWhereInput<User>()).toEqual({})
  })

  it("should map primitive fields directly", () => {
    const filters = { id: "123", age: 25, isActive: true }
    const result = buildWhereInput<User>(filters)
    expect(result).toEqual(filters)
  })

  it("should transform string fields into contains with insensitive mode", () => {
    const filters = { name: "John", email: "test@example.com" }
    const result = buildWhereInput<User>(filters, {
      stringFields: ["name", "email"],
    })

    expect(result).toEqual({
      name: { contains: "John", mode: "insensitive" },
      email: { contains: "test@example.com", mode: "insensitive" },
    })
  })

  it("should transform date fields into Date objects", () => {
    const filters = { birthdate: "2025-09-16" }
    const result = buildWhereInput<User>(filters, {
      dateFields: ["birthdate"],
    })

    expect(result.birthdate).toBeInstanceOf(Date)
    expect(result.birthdate.toISOString()).toBe(new Date("2025-09-16").toISOString())
  })

  it("should ignore undefined values", () => {
    const filters = { id: undefined, name: "Alice" }
    const result = buildWhereInput<User>(filters, {
      stringFields: ["name"],
    })

    expect(result).toEqual({
      name: { contains: "Alice", mode: "insensitive" },
    })
  })

  it("should handle mixed field types correctly", () => {
    const filters = {
      id: "abc",
      name: "Bob",
      birthdate: "2025-01-01",
      age: 30,
      isActive: false,
    }

    const result = buildWhereInput<User>(filters, {
      stringFields: ["name"],
      dateFields: ["birthdate"],
    })

    expect(result).toEqual({
      id: "abc",
      name: { contains: "Bob", mode: "insensitive" },
      birthdate: new Date("2025-01-01"),
      age: 30,
      isActive: false,
    })
  })
})
