import { UserCommandRepository } from "@/infra/repositories"
import { UserAdapter } from "@/infra/adpters"
import { Id } from "@/domain/valueObjects"
import { TUser } from "@/domain/protocols"

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
        salary: 2531.00,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: undefined
      }

      const entity = UserAdapter.toEntity(model)
        
      jest.spyOn(UserAdapter, "toModel").mockReturnValue(model)
      jest.spyOn(UserAdapter, "toEntity").mockReturnValue(entity)

      prismaMock.create.mockResolvedValue(model)

      const result = await repo.create(entity)

      expect(UserAdapter.toModel).toHaveBeenCalledWith(entity)
      expect(prismaMock.create).toHaveBeenCalledWith({ data: model })
      expect(UserAdapter.toEntity).toHaveBeenCalledWith(model)
      expect(result).toBe(entity)
    })
  })

  describe("update", () => {
    it("should update a user", async () => {
      const mockId = Id.generate().toString()
      const partialModel = {
        id: mockId, 
        name: "Updated Name" 
      }
      const dto = UserAdapter.toDTO(partialModel)

      jest.spyOn(UserAdapter, "toPartialModel").mockReturnValue({ ...partialModel })

      await repo.update(dto)

      expect(UserAdapter.toPartialModel).toHaveBeenCalledWith(dto)
      expect(prismaMock.update).toHaveBeenCalledWith({
        where: { id: mockId.toString() },
        data: { name: "Updated Name" },
      })
    })
  })

  describe("softDelete", () => {
    it("should soft delete a user", async () => {
      const id = Id.generate()

      await repo.softDelete(id)

      expect(prismaMock.update).toHaveBeenCalledWith({
        where: { id: id.toString() },
        data: { deletedAt: expect.any(String) },
      })
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
  })
})
