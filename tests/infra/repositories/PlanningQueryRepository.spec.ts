import { PlanningQueryRepository } from "@/infra/repositories"
import { PlanningAdapter } from "@/infra/adpters"
import { Id, Name, DateEpoch, MoneyValue, Goal, Plan } from "@/domain/valueObjects"
import { Planning } from "@/domain/entities"
import { buildWhereInput } from "@/infra/utils"
import { TPlanning } from "@/domain/protocols"
import { DatabaseException } from "@/infra/exceptions"

jest.mock("@prisma/client", () => {
  const mPlanning = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
  }
  return { PrismaClient: jest.fn(() => ({ planing: mPlanning })) }
})

jest.mock("@/infra/adpters", () => ({
  PlanningAdapter: { toEntity: jest.fn() },
}))

jest.mock("@/infra/utils", () => ({
  buildWhereInput: jest.fn(),
}))

describe("[Repository] PlanningQueryRepository", () => {
  let repo: PlanningQueryRepository
  let prismaMock: any

  beforeEach(() => {
    repo = new PlanningQueryRepository()
    prismaMock = (repo as any)._db
    jest.resetAllMocks() // 👈 evita vazamento de mocks
  })

  describe("get", () => {
    it("should return a Planning entity if found", async () => {
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

      const entity = new Planning(
        id,
        userId,
        new Name(dbPlanning.name),
        new Goal(dbPlanning.goal),
        new MoneyValue(dbPlanning.goalValue),
        new Plan(dbPlanning.plan),
        new DateEpoch(dbPlanning.createdAt)
      )

      prismaMock.findUnique.mockResolvedValue(dbPlanning)
      ;(PlanningAdapter.toEntity as jest.Mock).mockReturnValue(entity)

      const result = await repo.get(id)

      expect(prismaMock.findUnique).toHaveBeenCalledWith({ where: { id: id.toString() } })
      expect(PlanningAdapter.toEntity).toHaveBeenCalledWith(dbPlanning)
      expect(result).toBe(entity)
    })

    it("should throw DatabaseException if prisma fails", async () => {
      const id = Id.generate()
      prismaMock.findUnique.mockRejectedValue(new DatabaseException("Prisma error"))

      await expect(repo.get(id)).rejects.toThrow(DatabaseException)
    })
  })

  describe("find", () => {
    it("should return a Planning entity if found with filters", async () => {
      const filters = { name: "Internet" }
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

      const entity = new Planning(
        id,
        userId,
        new Name(dbPlanning.name),
        new Goal(dbPlanning.goal),
        new MoneyValue(dbPlanning.goalValue),
        new Plan(dbPlanning.plan),
        new DateEpoch(dbPlanning.createdAt)
      )

      ;(buildWhereInput as jest.Mock).mockReturnValue({ name: "Internet" })
      prismaMock.findFirst.mockResolvedValue(dbPlanning)
      ;(PlanningAdapter.toEntity as jest.Mock).mockReturnValue(entity)

      const result = await repo.find(filters)

      expect(buildWhereInput).toHaveBeenCalledWith(filters, {
        stringFields: ["id", "userId", "name", "description", "goal", "plan"],
        dateFields: ["createdAt", "updatedAt", "deletedAt"]
      })
      expect(prismaMock.findFirst).toHaveBeenCalledWith({ where: { name: "Internet" } })
      expect(PlanningAdapter.toEntity).toHaveBeenCalledWith(dbPlanning)
      expect(result).toBe(entity)
    })

    it("should throw error if no Planning found", async () => {
      prismaMock.findFirst.mockResolvedValue(null)
      await expect(repo.find({ name: "Nonexistent" })).rejects.toThrow("Planning not found")
    })

    it("should throw DatabaseException if prisma fails", async () => {
      prismaMock.findFirst.mockRejectedValue(new DatabaseException("Prisma error"))
      await expect(repo.find({ name: "Error" })).rejects.toThrow(DatabaseException)
    })
  })

  describe("list", () => {
    it("should return an array of Planning entities", async () => {
      const filters = { name: "house" }
      const dbPlannings = [
        {
          id: Id.generate().toString(),
          userId: Id.generate().toString(),
          name: "car",
          goal: "Car",
          goalValue: 100000,
          plan: "Aoba",
          createdAt: new Date().toISOString(),
        },
        {
          id: Id.generate().toString(),
          userId: Id.generate().toString(),
          name: "house",
          goal: "House",
          goalValue: 500000,
          plan: "Aoba2",
          createdAt: new Date().toISOString(),
        },
      ]

      const entities = dbPlannings.map(
        (planning) =>
          new Planning(
            new Id(planning.id),
            new Id(planning.userId),
            new Name(planning.name),
            new Goal(planning.goal),
            new MoneyValue(planning.goalValue),
            new Plan(planning.plan),
            new DateEpoch(planning.createdAt)
          )
      )

      ;(buildWhereInput as jest.Mock).mockReturnValue({ name: "car" })
      prismaMock.findMany.mockResolvedValue(dbPlannings)
      ;(PlanningAdapter.toEntity as jest.Mock).mockImplementation(
        (Planning: TPlanning.Model) => entities.find((e) => e.getId().toString() === Planning.id)
      )

      const result = await repo.list(filters)

      expect(buildWhereInput).toHaveBeenCalledWith(filters, {
        stringFields: ["id", "userId", "name", "description", "goal", "plan"],
        dateFields: ["createdAt", "updatedAt", "deletedAt"]
      })
      expect(prismaMock.findMany).toHaveBeenCalledWith({ where: { name: "car" } })
      expect(PlanningAdapter.toEntity).toHaveBeenCalledTimes(2)
      expect(result).toEqual(entities)
    })

    it("should return empty array if no Plannings found", async () => {
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
