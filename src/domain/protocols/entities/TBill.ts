export namespace TBill {
  export type Entity = {
    id: string,
    userId: string,
    name: string,
    value: number,
    description?: string | null,
    installmentsNumber?: number| null,
    createdAt: Date | string,
    updatedAt?: Date | string| null,
    deletedAt?: Date | string| null,
  }

  export type Model = {
    id: string,
    userId: string,
    name: string,
    value: number,
    description?: string | null,
    installmentsNumber?: number | null,
    createdAt: Date | string,
    updatedAt?: Date | string | null,
    deletedAt?: Date | string | null,
  }

  export type DTO = {
    id: string,
    name?: string,
    value?: number,
    description?: string | null,
    installmentsNumber?: number | null,
    updatedAt?: Date | string | null,
    deletedAt?: Date | string | null,
  }
}