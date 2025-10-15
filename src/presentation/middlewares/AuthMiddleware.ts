import { Request, Response, NextFunction } from 'express'
import { TokenService } from '@/infra/utils/TokenService'
import { Id } from '@/domain/valueObjects'

export interface AuthenticatedRequest extends Request {
  userId?: string
}

export class AuthMiddleware {
  private static tokenService = new TokenService({
    jwtSecret: process.env.JWT_SECRET,
    tokenExpireHours: 24
  })

  /**
   * Middleware to authenticate requests using JWT tokens
   * Expects token in Authorization header as "Bearer <token>"
   */
  public static authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const authHeader = req.headers.authorization

      if (!authHeader) {
        res.status(401).json({ error: 'No token provided' })
        return
      }

      const parts = authHeader.split(' ')

      if (parts.length !== 2) {
        res.status(401).json({ error: 'Token error' })
        return
      }

      const [scheme, token] = parts

      if (!/^Bearer$/i.test(scheme)) {
        res.status(401).json({ error: 'Token malformatted' })
        return
      }

      try {
        const userId = AuthMiddleware.tokenService.getUserIdFromToken(token)
        
        // Attach userId to request for use in controllers
        req.userId = userId.toString()
        
        next()
      } catch (error) {
        res.status(401).json({ error: 'Invalid token' })
        return
      }
    } catch (error) {
      res.status(401).json({ error: 'Token validation failed' })
      return
    }
  }
}

