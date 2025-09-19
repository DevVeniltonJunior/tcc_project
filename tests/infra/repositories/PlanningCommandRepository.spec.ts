import { PlanningCommandRepository } from "@/infra/repositories"
import { PlanningAdapter } from "@/infra/adpters"
import { Id } from "@/domain/valueObjects"
import { TPlanning } from "@/domain/protocols"
import { DatabaseException } from "@/infra/exceptions"

jest.mock("@prisma/client", () => {
  const mPlanning = {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
  return {
    PrismaClient: jest.fn(() => ({
      planing: mPlanning,
    })),
  }
})

describe("[Repository] PlanningCommandRepository", () => {
  let repo: PlanningCommandRepository
  let prismaMock: any

  beforeEach(() => {
    repo = new PlanningCommandRepository()
    prismaMock = (repo as any)._db
    jest.clearAllMocks()
  })

  describe("create", () => {
    it("should create a Planning and return an entity", async () => {
      const id = Id.generate()
      const userId = Id.generate()
      const dbPlanning = {
        id: id.toString(),
        userId: userId.toString(),
        name: "Internet",
        goal: "Car",
        goalValue: 100000,
        plan: "Aoba",
        createdAt: new Date().toISOString(),
      }

      const entity = PlanningAdapter.toEntity(dbPlanning)

      jest.spyOn(PlanningAdapter, "toModel").mockReturnValue(dbPlanning)
      jest.spyOn(PlanningAdapter, "toEntity").mockReturnValue(entity)

      prismaMock.create.mockResolvedValue(dbPlanning)

      const result = await repo.create(entity)

      expect(PlanningAdapter.toModel).toHaveBeenCalledWith(entity)
      expect(prismaMock.create).toHaveBeenCalledWith({ data: dbPlanning })
      expect(PlanningAdapter.toEntity).toHaveBeenCalledWith(dbPlanning)
      expect(result).toBe(entity)
    })

    it("should throw DatabaseException if prisma fails", async () => {
      const entity = PlanningAdapter.toEntity({
        id: Id.generate().toString(),
        userId: Id.generate().toString(),
        name: "Internet",
        goal: "Car",
        goalValue: 100000,
        plan: "Aoba",
        createdAt: new Date().toISOString(),
      })

      prismaMock.create.mockRejectedValue(new DatabaseException("Prisma error"))

      await expect(repo.create(entity)).rejects.toThrow(DatabaseException)
    })
  })

  describe("update", () => {
    it("should update a Planning", async () => {
      const mockId = Id.generate().toString()
      const partialModel = { id: mockId, name: "Updated Name" }
      const dto = PlanningAdapter.toDTO(partialModel)

      jest.spyOn(PlanningAdapter, "toPartialModel").mockReturnValue({ ...partialModel })

      await repo.update(dto)

      expect(PlanningAdapter.toPartialModel).toHaveBeenCalledWith(dto)
      expect(prismaMock.update).toHaveBeenCalledWith({
        where: { id: mockId.toString() },
        data: { name: "Updated Name" },
      })
    })

    it("should throw DatabaseException if prisma fails", async () => {
      prismaMock.update.mockRejectedValue(new DatabaseException("Prisma error"))

      await expect(repo.update({ id: "123", name: "Fail" } as any)).rejects.toThrow(DatabaseException)
    })
  })

  describe("softDelete", () => {
    beforeEach(() => {
      repo = new PlanningCommandRepository()
      prismaMock = (repo as any)._db
      jest.resetAllMocks() // 👈 limpa implementações também
    })

    it("should soft delete a Planning", async () => {
      const id = Id.generate()

      await repo.softDelete(id)

      expect(prismaMock.update).toHaveBeenCalledWith({
        where: { id: id.toString() },
        data: { deletedAt: expect.any(String) },
      })
    })

    it("should throw DatabaseException if prisma fails", async () => {
      prismaMock.update.mockRejectedValue(new DatabaseException("Prisma error"))
      const id = Id.generate()

      await expect(repo.softDelete(id)).rejects.toThrow(DatabaseException)
    })
  })

  describe("hardDelete", () => {
    it("should hard delete a Planning", async () => {
      const id = Id.generate()

      await repo.hardDelete(id)

      expect(prismaMock.delete).toHaveBeenCalledWith({
        where: { id: id.toString() },
      })
    })

    it("should throw DatabaseException if prisma fails", async () => {
      prismaMock.delete.mockRejectedValue(new DatabaseException("Prisma error"))
      const id = Id.generate()

      await expect(repo.hardDelete(id)).rejects.toThrow(DatabaseException)
    })
  })
})
