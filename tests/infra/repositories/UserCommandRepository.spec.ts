import { UserCommandRepository } from "@/infra/repositories"
import { UserAdapter } from "@/infra/adpters"
import { Id } from "@/domain/valueObjects"
import { TUser } from "@/domain/protocols"
import { DatabaseException } from "@/infra/exceptions"

jest.mock("@prisma/client", () => {
  const mUser = {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
  return {
    PrismaClient: jest.fn(() => ({
      user: mUser,
    })),
  }
})

describe("[Repository] UserCommandRepository", () => {
  let repo: UserCommandRepository
  let prismaMock: any

  beforeEach(() => {
    repo = new UserCommandRepository()
    prismaMock = (repo as any)._db
    jest.clearAllMocks()
  })

  describe("create", () => {
    it("should create a user and return an entity", async () => {
      const model: TUser.Entity = {
        id: Id.generate().toString(),
        name: "Internet",
        birthdate: new Date().toISOString(),
        email: "JohnDoe@gmail.com",
        salary: 2531.0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: undefined,
      }

      const entity = UserAdapter.toEntity(model)

      jest.spyOn(UserAdapter, "toModel").mockReturnValue(model)
      jest.spyOn(UserAdapter, "toEntity").mockReturnValue(entity)

      prismaMock.create.mockResolvedValue(model)

      const result = await repo.create(entity)

      expect(UserAdapter.toModel).toHaveBeenCalledWith(entity)
      expect(prismaMock.create).toHaveBeenCalledWith({ data: model, include: { password: true, bills: true, plannings: true } })
      expect(UserAdapter.toEntity).toHaveBeenCalledWith(model)
      expect(result).toBe(entity)
    })

    it("should throw DatabaseException if prisma fails", async () => {
      const entity = UserAdapter.toEntity({
        id: Id.generate().toString(),
        name: "FailUser",
        birthdate: new Date().toISOString(),
        email: "fail@gmail.com",
        salary: 1000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: undefined,
      })

      prismaMock.create.mockRejectedValue(new Error("Prisma error"))

      await expect(repo.create(entity)).rejects.toThrow(DatabaseException)
    })
  })

  describe("update", () => {
    it("should update a user", async () => {
      const mockId = Id.generate().toString()
      const partialModel = { id: mockId, name: "Updated Name" }
      const dto = UserAdapter.toDTO(partialModel)

      jest.spyOn(UserAdapter, "toPartialModel").mockReturnValue({ ...partialModel })

      await repo.update(dto)

      expect(UserAdapter.toPartialModel).toHaveBeenCalledWith(dto)
      expect(prismaMock.update).toHaveBeenCalledWith({
        where: { id: mockId.toString() },
        data: { name: "Updated Name" },
      })
    })

    it("should throw DatabaseException if prisma fails", async () => {
      prismaMock.update.mockRejectedValue(new Error("Prisma error"))

      await expect(repo.update({ id: "123", name: "Fail" } as any)).rejects.toThrow(DatabaseException)
    })
  })

  describe("softDelete", () => {
    beforeEach(() => {
      repo = new UserCommandRepository()
      prismaMock = (repo as any)._db
      jest.resetAllMocks() // 👈 limpa implementações também
    })

    it("should soft delete a user", async () => {
      const id = Id.generate()

      await repo.softDelete(id)

      expect(prismaMock.update).toHaveBeenCalledWith({
        where: { id: id.toString() },
        data: { deletedAt: expect.any(String) },
      })
    })

    it("should throw DatabaseException if prisma fails", async () => {
      prismaMock.update.mockRejectedValue(new Error("Prisma error"))
      const id = Id.generate()

      await expect(repo.softDelete(id)).rejects.toThrow(DatabaseException)
    })
  })

  describe("hardDelete", () => {
    it("should hard delete a user", async () => {
      const id = Id.generate()

      await repo.hardDelete(id)

      expect(prismaMock.delete).toHaveBeenCalledWith({
        where: { id: id.toString() },
      })
    })

    it("should throw DatabaseException if prisma fails", async () => {
      prismaMock.delete.mockRejectedValue(new Error("Prisma error"))
      const id = Id.generate()

      await expect(repo.hardDelete(id)).rejects.toThrow(DatabaseException)
    })
  })
})
