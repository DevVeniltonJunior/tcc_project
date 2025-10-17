import jwt from "jsonwebtoken"
import { randomBytes } from "crypto"
import { Id } from "@/domain/valueObjects"
import { TokenServiceConfig, TokenPayload } from "@/infra/protocols"

export class TokenService {
  private readonly TOKEN_EXPIRE_HOURS: number
  private readonly JWT_SECRET: string

  constructor(config: TokenServiceConfig = {}) {
    this.TOKEN_EXPIRE_HOURS = config.tokenExpireHours ?? 24
    this.JWT_SECRET = config.jwtSecret ?? this.generateDefaultSecret()
  }

  private generateDefaultSecret(): string {
    return process.env.JWT_PASSWORD_RESET_SECRET ?? randomBytes(32).toString("hex")
  }

  public generateTokenForUser(userId: Id): string {
    if (!userId || userId.toString().trim() === "") {
      throw new Error("User identifier cannot be empty")
    }

    const payload: TokenPayload = {
      userId: userId.toString(),
      createdAt: Date.now(),
    }

    const token = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: `${this.TOKEN_EXPIRE_HOURS}h`,
    })

    return token
  }

  public validateToken(
    userId: Id,
    token: string
  ): boolean {
    if (!userId || !token) {
      return false
    }

    try {

      const decoded = jwt.verify(token, this.JWT_SECRET) as TokenPayload

      if (decoded.userId !== userId.toString()) {
        return false
      }

      const now = Date.now()
      const hoursPassed = (now - decoded.createdAt) / (1000 * 60 * 60)

      if (hoursPassed > this.TOKEN_EXPIRE_HOURS) {
        return false
      }

      return true
    } catch (error) {
      return false
    }
  }

  public getUserIdFromToken(token: string): Id {
    const decoded = jwt.verify(token, this.JWT_SECRET) as TokenPayload
    return new Id(decoded.userId)
  }
}
