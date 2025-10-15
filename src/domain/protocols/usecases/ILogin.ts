import { User } from "@/domain/entities"
import { Email } from "@/domain/valueObjects"

export interface ILogin {
  execute: (email: Email, password: string) => Promise<{
    user: User,
    token: string
  }>
}

