import { BillQueryRepository } from "@/infra/repositories"
import { BillAdapter } from "@/infra/adpters"
import { Id, Name, DateEpoch, MoneyValue } from "@/domain/valueObjects"
import { Bill } from "@/domain/entities"
import { buildWhereInput } from "@/infra/utils"
import { TBill } from "@/domain/protocols"
import { DatabaseException } from "@/infra/exceptions"

jest.mock("@prisma/client", () => {
  const mBill = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
  }
  return { PrismaClient: jest.fn(() => ({ bill: mBill })) }
})

jest.mock("@/infra/adpters", () => ({
  BillAdapter: { toEntity: jest.fn() },
}))

jest.mock("@/infra/utils", () => ({
  buildWhereInput: jest.fn(),
}))

describe("[Repository] BillQueryRepository", () => {
  let repo: BillQueryRepository
  let prismaMock: any

  beforeEach(() => {
    repo = new BillQueryRepository()
    prismaMock = (repo as any)._db
    jest.resetAllMocks() // 👈 evita vazamento de mocks
  })

  describe("get", () => {
    it("should return a Bill entity if found", async () => {
      const id = Id.generate()
      const userId = Id.generate()
      const dbBill = {
        id: id.toString(),
        userId: userId.toString(),
        name: "Internet",
        value: 100,
        createdAt: new Date().toISOString(),
      }

      const entity = new Bill(
        id,
        userId,
        new Name(dbBill.name),
        new MoneyValue(dbBill.value),
        new DateEpoch(dbBill.createdAt)
      )

      prismaMock.findUnique.mockResolvedValue(dbBill)
      ;(BillAdapter.toEntity as jest.Mock).mockReturnValue(entity)

      const result = await repo.get(id)

      expect(prismaMock.findUnique).toHaveBeenCalledWith({ where: { id: id.toString() } })
      expect(BillAdapter.toEntity).toHaveBeenCalledWith(dbBill)
      expect(result).toBe(entity)
    })

    it("should throw DatabaseException if prisma fails", async () => {
      const id = Id.generate()
      prismaMock.findUnique.mockRejectedValue(new DatabaseException("Prisma error"))

      await expect(repo.get(id)).rejects.toThrow(DatabaseException)
    })
  })

  describe("find", () => {
    it("should return a Bill entity if found with filters", async () => {
      const filters = { name: "Internet" }
      const id = Id.generate()
      const userId = Id.generate()
      const dbBill = {
        id: id.toString(),
        userId: userId.toString(),
        name: "Internet",
        value: 100,
        createdAt: new Date().toISOString(),
      }

      const entity = new Bill(
        id,
        userId,
        new Name(dbBill.name),
        new MoneyValue(dbBill.value),
        new DateEpoch(dbBill.createdAt)
      )

      ;(buildWhereInput as jest.Mock).mockReturnValue({ name: "Internet" })
      prismaMock.findFirst.mockResolvedValue(dbBill)
      ;(BillAdapter.toEntity as jest.Mock).mockReturnValue(entity)

      const result = await repo.find(filters)

      expect(buildWhereInput).toHaveBeenCalledWith(filters, {
        stringFields: ["id", "name", "userId", "description"],
        dateFields: ["createdAt", "updatedAt", "deletedAt"],
      })
      expect(prismaMock.findFirst).toHaveBeenCalledWith({ where: { name: "Internet" } })
      expect(BillAdapter.toEntity).toHaveBeenCalledWith(dbBill)
      expect(result).toBe(entity)
    })

    it("should throw error if no Bill found", async () => {
      prismaMock.findFirst.mockResolvedValue(null)
      await expect(repo.find({ name: "Nonexistent" })).rejects.toThrow("Bill not found")
    })

    it("should throw DatabaseException if prisma fails", async () => {
      prismaMock.findFirst.mockRejectedValue(new DatabaseException("Prisma error"))
      await expect(repo.find({ name: "Error" })).rejects.toThrow(DatabaseException)
    })
  })

  describe("list", () => {
    it("should return an array of Bill entities", async () => {
      const filters = { name: "Water" }
      const userId = Id.generate()
      const dbBills = [
        {
          id: Id.generate().toString(),
          userId: userId.toString(),
          name: "Internet",
          value: 120,
          createdAt: new Date().toISOString(),
        },
        {
          id: Id.generate().toString(),
          userId: userId.toString(),
          name: "Water",
          value: 70,
          createdAt: new Date().toISOString(),
        },
      ]

      const entities = dbBills.map(
        (bill) =>
          new Bill(
            new Id(bill.id),
            new Id(bill.userId),
            new Name(bill.name),
            new MoneyValue(bill.value),
            new DateEpoch(bill.createdAt)
          )
      )

      ;(buildWhereInput as jest.Mock).mockReturnValue({ name: "Water" })
      prismaMock.findMany.mockResolvedValue(dbBills)
      ;(BillAdapter.toEntity as jest.Mock).mockImplementation(
        (Bill: TBill.Model) => entities.find((e) => e.getId().toString() === Bill.id)
      )

      const result = await repo.list(filters)

      expect(buildWhereInput).toHaveBeenCalledWith(filters, {
        stringFields: ["id", "name", "userId", "description"],
        dateFields: ["createdAt", "updatedAt", "deletedAt"],
      })
      expect(prismaMock.findMany).toHaveBeenCalledWith({ where: { name: "Water" } })
      expect(BillAdapter.toEntity).toHaveBeenCalledTimes(2)
      expect(result).toEqual(entities)
    })

    it("should return empty array if no Bills found", async () => {
      ;(buildWhereInput as jest.Mock).mockReturnValue({})
      prismaMock.findMany.mockResolvedValue([])

      const result = await repo.list({ name: "Nonexistent" })
      expect(result).toEqual([])
    })

    it("should throw DatabaseException if prisma fails", async () => {
      prismaMock.findMany.mockRejectedValue(new DatabaseException("Prisma error"))
      await expect(repo.list({ name: "Error" })).rejects.toThrow(DatabaseException)
    })
  })
})
