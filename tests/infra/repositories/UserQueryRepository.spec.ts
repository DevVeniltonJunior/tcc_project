import { UserQueryRepository } from "@/infra/repositories"
import { UserAdapter } from "@/infra/adpters"
import { Id, Name, Email, DateEpoch } from "@/domain/valueObjects"
import { User } from "@/domain/entities"
import { buildWhereInput } from "@/infra/utils"
import { TUser } from "@/domain/protocols"
import { DatabaseException } from "@/infra/exceptions"

jest.mock("@prisma/client", () => {
  const mUser = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
  }
  return { PrismaClient: jest.fn(() => ({ user: mUser })) }
})

jest.mock("@/infra/adpters", () => ({
  UserAdapter: { toEntity: jest.fn() },
}))

jest.mock("@/infra/utils", () => ({
  buildWhereInput: jest.fn(),
}))

describe("[Repository] UserQueryRepository", () => {
  let repo: UserQueryRepository
  let prismaMock: any

  beforeEach(() => {
    repo = new UserQueryRepository()
    prismaMock = (repo as any)._db
    jest.resetAllMocks() // 👈 evita vazamento de mocks
  })

  describe("get", () => {
    it("should return a user entity if found", async () => {
      const id = Id.generate()
      const dbUser = {
        id: id.toString(),
        name: "Internet",
        birthdate: new Date().toISOString(),
        email: "JohnDoe@gmail.com",
        salary: null,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        deletedAt: null,
      }

      const entity = new User(
        id,
        new Name(dbUser.name),
        new DateEpoch(dbUser.birthdate),
        new Email(dbUser.email),
        new DateEpoch(dbUser.createdAt)
      )

      prismaMock.findUnique.mockResolvedValue(dbUser)
      ;(UserAdapter.toEntity as jest.Mock).mockReturnValue(entity)

      const result = await repo.get(id)

      expect(prismaMock.findUnique).toHaveBeenCalledWith({ where: { id: id.toString() } })
      expect(UserAdapter.toEntity).toHaveBeenCalledWith(dbUser)
      expect(result).toBe(entity)
    })

    it("should throw DatabaseException if prisma fails", async () => {
      const id = Id.generate()
      prismaMock.findUnique.mockRejectedValue(new Error("Prisma error"))

      await expect(repo.get(id)).rejects.toThrow(DatabaseException)
    })
  })

  describe("find", () => {
    it("should return a user entity if found with filters", async () => {
      const filters = { name: "John" }
      const id = Id.generate()
      const dbUser = {
        id: id.toString(),
        name: "John",
        birthdate: new Date().toISOString(),
        email: "JohnDoe@gmail.com",
        salary: null,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        deletedAt: null,
      }

      const entity = new User(
        id,
        new Name(dbUser.name),
        new DateEpoch(dbUser.birthdate),
        new Email(dbUser.email),
        new DateEpoch(dbUser.createdAt)
      )

      ;(buildWhereInput as jest.Mock).mockReturnValue({ name: "John" })
      prismaMock.findFirst.mockResolvedValue(dbUser)
      ;(UserAdapter.toEntity as jest.Mock).mockReturnValue(entity)

      const result = await repo.find(filters)

      expect(buildWhereInput).toHaveBeenCalledWith(filters, {
        stringFields: ["id", "name", "email"],
        dateFields: ["birthdate", "createdAt", "updatedAt", "deletedAt"],
      })
      expect(prismaMock.findFirst).toHaveBeenCalledWith({ where: { name: "John" } })
      expect(UserAdapter.toEntity).toHaveBeenCalledWith(dbUser)
      expect(result).toBe(entity)
    })

    it("should throw error if no user found", async () => {
      prismaMock.findFirst.mockResolvedValue(null)
      await expect(repo.find({ name: "Nonexistent" })).rejects.toThrow("User not found")
    })

    it("should throw DatabaseException if prisma fails", async () => {
      prismaMock.findFirst.mockRejectedValue(new Error("Prisma error"))
      await expect(repo.find({ name: "Error" })).rejects.toThrow(DatabaseException)
    })
  })

  describe("list", () => {
    it("should return an array of user entities", async () => {
      const filters = { name: "John" }
      const dbUsers = [
        {
          id: Id.generate().toString(),
          name: "John",
          birthdate: new Date().toISOString(),
          email: "JohnDoe@gmail.com",
          salary: null,
          createdAt: new Date().toISOString(),
          updatedAt: null,
          deletedAt: null,
        },
        {
          id: Id.generate().toString(),
          name: "Jane",
          birthdate: new Date().toISOString(),
          email: "JaneDoe@gmail.com",
          salary: null,
          createdAt: new Date().toISOString(),
          updatedAt: null,
          deletedAt: null,
        },
      ]

      const entities = dbUsers.map(
        (user) =>
          new User(
            new Id(user.id),
            new Name(user.name),
            new DateEpoch(user.birthdate),
            new Email(user.email),
            new DateEpoch(user.createdAt)
          )
      )

      ;(buildWhereInput as jest.Mock).mockReturnValue({ name: "John" })
      prismaMock.findMany.mockResolvedValue(dbUsers)
      ;(UserAdapter.toEntity as jest.Mock).mockImplementation(
        (user: TUser.Model) => entities.find((e) => e.getId().toString() === user.id)
      )

      const result = await repo.list(filters)

      expect(buildWhereInput).toHaveBeenCalledWith(filters, {
        stringFields: ["id", "name", "email"],
        dateFields: ["birthdate", "createdAt", "updatedAt", "deletedAt"],
      })
      expect(prismaMock.findMany).toHaveBeenCalledWith({ where: { name: "John" } })
      expect(UserAdapter.toEntity).toHaveBeenCalledTimes(2)
      expect(result).toEqual(entities)
    })

    it("should return empty array if no users found", async () => {
      ;(buildWhereInput as jest.Mock).mockReturnValue({})
      prismaMock.findMany.mockResolvedValue([])

      const result = await repo.list({ name: "Nonexistent" })
      expect(result).toEqual([])
    })

    it("should throw DatabaseException if prisma fails", async () => {
      prismaMock.findMany.mockRejectedValue(new Error("Prisma error"))
      await expect(repo.list({ name: "Error" })).rejects.toThrow(DatabaseException)
    })
  })
})
