export namespace TPlanning {
  export type Entity = {
    id: string,
    userId: string,
    name: string,
    description?: string,
    goal: string,
    goalValue: number,
    plan: string,
    createdAt: Date | string,
    updatedAt?: Date | string,
    deletedAt?: Date | string,
  }

  export type Model = {
    id: string,
    userId: string,
    name: string,
    description?: string,
    goal: string,
    goalValue: number,
    plan: string,
    createdAt: Date | string,
    updatedAt?: Date | string,
    deletedAt?: Date | string,
  }

  export type DTO = {
    id: string,
    name?: string,
    description?: string,
    goal?: string,
    goalValue?: number,
    plan?: string,
    updatedAt?: Date | string,
    deletedAt?: Date | string,
  }
}