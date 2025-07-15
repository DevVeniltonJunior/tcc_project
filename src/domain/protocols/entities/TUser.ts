import { TPassword, TBill, TPlanning } from "@/domain/protocols";

export namespace TUser {
  export type Entity = {
    id: string,
    name: string,
    birthdate: Date | string,
    email: string,
    salary?: number,
    password: TPassword.Entity,
    bills: TBill.Entity[],
    planning: TPlanning.Entity[],
    createdAt: Date | string,
    updatedAt?: Date | string,
    deletedAt?: Date | string,
  }

  export type Model = {
    id: string,
    name: string,
    birthdate: Date | string,
    email: string,
    salary?: number,
    createdAt: Date | string,
    updatedAt?: Date | string,
    deletedAt?: Date | string,
  }

  export type DTO = {
    id: string,
    name?: string,
    birthdate?: Date | string,
    email?: string,
    salary?: number,
    updatedAt?: Date | string,
    deletedAt?: Date | string,
  }
}