import { BillCommandRepository } from "@/infra/repositories"
import { BillAdapter } from "@/infra/adpters"
import { Id } from "@/domain/valueObjects"
import { TBill } from "@/domain/protocols"
import { DatabaseException } from "@/infra/exceptions"

jest.mock("@prisma/client", () => {
  const mBill = {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
  return {
    PrismaClient: jest.fn(() => ({
      bill: mBill,
    })),
  }
})

describe("[Repository] BillCommandRepository", () => {
  let repo: BillCommandRepository
  let prismaMock: any

  beforeEach(() => {
    repo = new BillCommandRepository()
    prismaMock = (repo as any)._db
    jest.clearAllMocks()
  })

  describe("create", () => {
    it("should create a Bill and return an entity", async () => {
      const id = Id.generate()
      const userId = Id.generate()
      const dbBill = {
        id: id.toString(),
        userId: userId.toString(),
        name: "Internet",
        value: 100,
        createdAt: new Date().toISOString(),
      }

      const entity = BillAdapter.toEntity(dbBill)

      jest.spyOn(BillAdapter, "toModel").mockReturnValue(dbBill)
      jest.spyOn(BillAdapter, "toEntity").mockReturnValue(entity)

      prismaMock.create.mockResolvedValue(dbBill)

      const result = await repo.create(entity)

      expect(BillAdapter.toModel).toHaveBeenCalledWith(entity)
      expect(prismaMock.create).toHaveBeenCalledWith({ data: dbBill })
      expect(BillAdapter.toEntity).toHaveBeenCalledWith(dbBill)
      expect(result).toBe(entity)
    })

    it("should throw DatabaseException if prisma fails", async () => {
      const entity = BillAdapter.toEntity({
        id: Id.generate().toString(),
        userId: Id.generate().toString(),
        name: "Internet",
        value: 100,
        createdAt: new Date().toISOString(),
      })

      prismaMock.create.mockRejectedValue(new DatabaseException("Prisma error"))

      await expect(repo.create(entity)).rejects.toThrow(DatabaseException)
    })
  })

  describe("update", () => {
    it("should update a Bill", async () => {
      const mockId = Id.generate().toString()
      const partialModel = { id: mockId, name: "Updated Name" }
      const dto = BillAdapter.toDTO(partialModel)

      jest.spyOn(BillAdapter, "toPartialModel").mockReturnValue({ ...partialModel })

      await repo.update(dto)

      expect(BillAdapter.toPartialModel).toHaveBeenCalledWith(dto)
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
      repo = new BillCommandRepository()
      prismaMock = (repo as any)._db
      jest.resetAllMocks() // 👈 limpa implementações também
    })

    it("should soft delete a Bill", async () => {
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
    it("should hard delete a Bill", async () => {
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
