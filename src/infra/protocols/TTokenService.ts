export interface TokenServiceConfig {
  tokenExpireHours?: number
  jwtSecret?: string
}

export interface TokenPayload {
  userId: string
  createdAt: number
}