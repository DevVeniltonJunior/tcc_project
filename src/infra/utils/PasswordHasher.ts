import bcrypt from "bcrypt"
import { ServiceException } from "@/infra/exceptions"

const DEFAULT_SALT_ROUNDS = 12

export class PasswordHasher {
  public static async encrypt(password: string, saltRounds: number = DEFAULT_SALT_ROUNDS): Promise<string> {
    try {
      const hash = await bcrypt.hash(password, saltRounds)
      return hash
    }
    catch (err: any) {
      throw new ServiceException(err.message)
    }
  }

  public static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return bcrypt.compare(password, hash)
    }
    catch (err: any) {
      throw new ServiceException(err.message)
    }
  }
}
