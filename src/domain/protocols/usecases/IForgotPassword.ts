import { User } from "@/domain/entities";

export interface IForgotPassword {
  execute: (user: User) => Promise<void>
}