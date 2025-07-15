export namespace TBill {
  export type Entity = {
    id: string,
    userId: string,
    name: string,
    value: number,
    description?: string,
    installmentsNumber?: number,
    createdAt: Date | string,
    updatedAt?: Date | string,
    deletedAt?: Date | string,
  }

  export type Model = {
    id: string,
    userId: string,
    name: string,
    value: number,
    description?: string,
    installmentsNumber?: number,
    createdAt: Date | string,
    updatedAt?: Date | string,
    deletedAt?: Date | string,
  }

  export type DTO = {
    id: string,
    name?: string,
    value?: number,
    description?: string,
    installmentsNumber?: number,
    updatedAt?: Date | string,
    deletedAt?: Date | string,
  }
}