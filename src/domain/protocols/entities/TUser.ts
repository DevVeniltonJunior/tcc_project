import { TPassword, TBill, TPlanning } from "@/domain/protocols";

export namespace TUser {
  export type Entity = {
    id: string,
    name: string,
    birthdate: Date | string,
    email: string,
    salary?: number | null,
    password?: TPassword.Entity,
    bills?: TBill.Entity[],
    planning?: TPlanning.Entity[],
    createdAt: Date | string,
    updatedAt?: Date | string | null,
    deletedAt?: Date | string | null,
  }

  export type Model = {
    id: string,
    name: string,
    birthdate: Date | string,
    email: string,
    salary?: number | null,
    createdAt: Date | string,
    updatedAt?: Date | string | null,
    deletedAt?: Date | string | null,
  }

  export type DTO = {
    id: string,
    name?: string,
    birthdate?: Date | string,
    email?: string,
    salary?: number | null,
    updatedAt?: Date | string | null,
    deletedAt?: Date | string | null,
  }
}
