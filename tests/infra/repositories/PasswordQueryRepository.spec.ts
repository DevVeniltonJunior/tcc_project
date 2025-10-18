import { PasswordQueryRepository } from "@/infra/repositories"
import { PasswordAdapter } from "@/infra/adpters"
import { Id, DateEpoch, PasswordHash, Bool } from "@/domain/valueObjects"
import { Password } from "@/domain/entities"
import { buildWhereInput } from "@/infra/utils"
import { TPassword } from "@/domain/protocols"
import { DatabaseException } from "@/infra/exceptions"

jest.mock("@prisma/client", () => {
  const mPassword = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
  }
  return { PrismaClient: jest.fn(() => ({ password: mPassword })) }
})

jest.mock("@/infra/adpters", () => ({
  PasswordAdapter: { toEntity: jest.fn() },
}))

jest.mock("@/infra/utils", () => ({
  buildWhereInput: jest.fn(),
}))

describe("[Repository] PasswordQueryRepository", () => {
  let repo: PasswordQueryRepository
  let prismaMock: any

  beforeEach(() => {
    repo = new PasswordQueryRepository()
    prismaMock = (repo as any)._db
    jest.resetAllMocks() // 👈 evita vazamento de mocks
  })

  describe("get", () => {
    it("should return a Password entity if found", async () => {
      const id = Id.generate()
      const userId = Id.generate()
      const dbPassword = {
        id: id.toString(),
        userId: userId.toString(),
        password: "Internet",
        active: true,
        createdAt: new Date().toISOString(),
      }

      const entity = new Password(
        id,
        userId,
        new PasswordHash(dbPassword.password),
        new Bool(dbPassword.active),
        new DateEpoch(dbPassword.createdAt)
      )

      prismaMock.findUnique.mockResolvedValue(dbPassword)
      ;(PasswordAdapter.toEntity as jest.Mock).mockReturnValue(entity)

      const result = await repo.get(id)

      expect(prismaMock.findUnique).toHaveBeenCalledWith({ where: { id: id.toString() } })
      expect(PasswordAdapter.toEntity).toHaveBeenCalledWith(dbPassword)
      expect(result).toBe(entity)
    })

    it("should throw DatabaseException if prisma fails", async () => {
      const id = Id.generate()
      prismaMock.findUnique.mockRejectedValue(new DatabaseException("Prisma error"))

      await expect(repo.get(id)).rejects.toThrow(DatabaseException)
    })
  })

  describe("find", () => {
    it("should return a Password entity if found with filters", async () => {
      const filters = { active: true }
      const id = Id.generate()
      const userId = Id.generate()
      const dbPassword = {
        id: id.toString(),
        userId: userId.toString(),
        password: "Internet",
        active: true,
        createdAt: new Date().toISOString(),
      }

      const entity = new Password(
        id,
        userId,
        new PasswordHash(dbPassword.password),
        new Bool(dbPassword.active),
        new DateEpoch(dbPassword.createdAt)
      )

      ;(buildWhereInput as jest.Mock).mockReturnValue({ active: true })
      prismaMock.findFirst.mockResolvedValue(dbPassword)
      ;(PasswordAdapter.toEntity as jest.Mock).mockReturnValue(entity)

      const result = await repo.find(filters)

      expect(buildWhereInput).toHaveBeenCalledWith(filters, {
        stringFields: ["id", "userId", "password"],
        dateFields: ["createdAt"],
      })
      expect(prismaMock.findFirst).toHaveBeenCalledWith({ where: { active: true } })
      expect(PasswordAdapter.toEntity).toHaveBeenCalledWith(dbPassword)
      expect(result).toBe(entity)
    })

    it("should throw error if no Password found", async () => {
      prismaMock.findFirst.mockResolvedValue(null)
      await expect(repo.find({ password: "Nonexistent" })).rejects.toThrow("Password not found")
    })

    it("should throw DatabaseException if prisma fails", async () => {
      prismaMock.findFirst.mockRejectedValue(new DatabaseException("Prisma error"))
      await expect(repo.find({ password: "Error" })).rejects.toThrow(DatabaseException)
    })
  })

  describe("list", () => {
    it("should return an array of Password entities", async () => {
      const filters = { active: true }
      const userId = Id.generate()
      const dbPasswords = [
        {
          id: Id.generate().toString(),
          userId: userId.toString(),
          password: "Internet",
          active: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: Id.generate().toString(),
          userId: userId.toString(),
          password: "Internet",
          active: false,
          createdAt: new Date().toISOString(),
        },
      ]

      const entities = dbPasswords.map(
        (password) =>
          new Password(
            new Id(password.id),
            new Id(password.userId),
            new PasswordHash(password.password),
            new Bool(password.active),
            new DateEpoch(password.createdAt)
          )
      )

      ;(buildWhereInput as jest.Mock).mockReturnValue({ active: true })
      prismaMock.findMany.mockResolvedValue(dbPasswords)
      ;(PasswordAdapter.toEntity as jest.Mock).mockImplementation(
        (Password: TPassword.Model) => entities.find((e) => e.getId().toString() === Password.id)
      )

      const result = await repo.list(filters)

      expect(buildWhereInput).toHaveBeenCalledWith(filters, {
        stringFields: ["id", "userId", "password"],
        dateFields: ["createdAt"],
      })
      expect(prismaMock.findMany).toHaveBeenCalledWith({ where: { active: true } })
      expect(PasswordAdapter.toEntity).toHaveBeenCalledTimes(2)
      expect(result).toEqual(entities)
    })

    it("should return empty array if no Passwords found", async () => {
      ;(buildWhereInput as jest.Mock).mockReturnValue({})
      prismaMock.findMany.mockResolvedValue([])

      const result = await repo.list({ password: "Nonexistent" })
      expect(result).toEqual([])
    })

    it("should throw DatabaseException if prisma fails", async () => {
      prismaMock.findMany.mockRejectedValue(new DatabaseException("Prisma error"))
      await expect(repo.list({ password: "Error" })).rejects.toThrow(DatabaseException)
    })
  })
})
