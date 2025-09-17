export namespace TPlanning {
  export type Entity = {
    id: string,
    userId: string,
    name: string,
    description?: string | null,
    goal: string,
    goalValue: number,
    plan: string,
    createdAt: Date | string,
    updatedAt?: Date | string | null,
    deletedAt?: Date | string | null,
  }

  export type Model = {
    id: string,
    userId: string,
    name: string,
    description?: string | null,
    goal: string,
    goalValue: number,
    plan: string,
    createdAt: Date | string,
    updatedAt?: Date | string | null,
    deletedAt?: Date | string | null,
  }

  export type DTO = {
    id: string,
    name?: string,
    description?: string | null,
    goal?: string,
    goalValue?: number,
    plan?: string,
    updatedAt?: Date | string | null,
    deletedAt?: Date | string | null,
  }
}