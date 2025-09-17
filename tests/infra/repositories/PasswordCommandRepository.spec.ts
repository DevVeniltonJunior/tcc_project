import { PasswordCommandRepository } from "@/infra/repositories"
import { PasswordAdapter } from "@/infra/adpters"
import { Id } from "@/domain/valueObjects"
import { TPassword } from "@/domain/protocols"
import { DatabaseException } from "@/infra/exception"

jest.mock("@prisma/client", () => {
  const mPassword = {
    create: jest.fn(),
    update: jest.fn(),
  }
  return {
    PrismaClient: jest.fn(() => ({
      password: mPassword,
    })),
  }
})

describe("[Repository] PasswordCommandRepository", () => {
  let repo: PasswordCommandRepository
  let prismaMock: any

  beforeEach(() => {
    repo = new PasswordCommandRepository()
    prismaMock = (repo as any)._db
    jest.clearAllMocks()
  })

  describe("create", () => {
    it("should create a Password and return an entity", async () => {
      const id = Id.generate()
      const userId = Id.generate()
      const dbPassword = {
        id: id.toString(),
        userId: userId.toString(),
        password: "Internet",
        active: true,
        createdAt: new Date().toISOString(),
      }

      const entity = PasswordAdapter.toEntity(dbPassword)

      jest.spyOn(PasswordAdapter, "toModel").mockReturnValue(dbPassword)
      jest.spyOn(PasswordAdapter, "toEntity").mockReturnValue(entity)

      prismaMock.create.mockResolvedValue(dbPassword)

      const result = await repo.create(entity)

      expect(PasswordAdapter.toModel).toHaveBeenCalledWith(entity)
      expect(prismaMock.create).toHaveBeenCalledWith({ data: dbPassword })
      expect(PasswordAdapter.toEntity).toHaveBeenCalledWith(dbPassword)
      expect(result).toBe(entity)
    })

    it("should throw DatabaseException if prisma fails", async () => {
      const entity = PasswordAdapter.toEntity({
        id: Id.generate().toString(),
        userId: Id.generate().toString(),
        password: "Internet",
        active: true,
        createdAt: new Date().toISOString(),
      })

      prismaMock.create.mockRejectedValue(new DatabaseException("Prisma error"))

      await expect(repo.create(entity)).rejects.toThrow(DatabaseException)
    })
  })

  describe("deactivate", () => {
    it("should deactivate a Password", async () => {
      const mockId = Id.generate()
      await repo.deactivate(mockId)

      expect(prismaMock.update).toHaveBeenCalledWith({
        where: { id: mockId.toString() },
        data: { active: false },
      })
    })

    it("should throw DatabaseException if prisma fails", async () => {
      prismaMock.update.mockRejectedValue(new DatabaseException("Prisma error"))

      await expect(repo.deactivate({ id: "123", name: "Fail" } as any)).rejects.toThrow(DatabaseException)
    })
  })
})
