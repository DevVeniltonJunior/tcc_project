import { AuthMiddleware, AuthenticatedRequest } from "@/presentation/middlewares/AuthMiddleware"
import { TokenService } from "@/infra/utils/TokenService"
import { Id } from "@/domain/valueObjects"
import { Response, NextFunction } from "express"

describe("[Middleware] AuthMiddleware", () => {
  let req: Partial<AuthenticatedRequest>
  let res: Partial<Response>
  let next: NextFunction
  let tokenServiceSpy: jest.SpyInstance

  const mockUserId = Id.generate()
  const validToken = "valid_jwt_token"

  beforeEach(() => {
    jest.restoreAllMocks()

    req = {
      headers: {}
    }

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    }

    next = jest.fn()

    tokenServiceSpy = jest.spyOn(TokenService.prototype, "getUserIdFromToken")
  })

  describe("Success cases", () => {
    it("should authenticate successfully with valid Bearer token", () => {
      tokenServiceSpy.mockReturnValue(mockUserId)

      req.headers = {
        authorization: `Bearer ${validToken}`
      }

      AuthMiddleware.authenticate(req as AuthenticatedRequest, res as Response, next)

      expect(tokenServiceSpy).toHaveBeenCalledWith(validToken)
      expect(req.userId).toBe(mockUserId.toString())
      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
      expect(res.json).not.toHaveBeenCalled()
    })

    it("should authenticate with Bearer scheme in different case (bearer/BEARER)", () => {
      tokenServiceSpy.mockReturnValue(mockUserId)

      req.headers = {
        authorization: `bearer ${validToken}`
      }

      AuthMiddleware.authenticate(req as AuthenticatedRequest, res as Response, next)

      expect(tokenServiceSpy).toHaveBeenCalledWith(validToken)
      expect(req.userId).toBe(mockUserId.toString())
      expect(next).toHaveBeenCalled()
    })
  })

  describe("Error cases", () => {
    it("should return 401 when no authorization header is provided", () => {
      req.headers = {}

      AuthMiddleware.authenticate(req as AuthenticatedRequest, res as Response, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ error: "No token provided" })
      expect(next).not.toHaveBeenCalled()
      expect(tokenServiceSpy).not.toHaveBeenCalled()
    })

    it("should return 401 when authorization header is undefined", () => {
      req.headers = {
        authorization: undefined
      }

      AuthMiddleware.authenticate(req as AuthenticatedRequest, res as Response, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ error: "No token provided" })
      expect(next).not.toHaveBeenCalled()
    })

    it("should return 401 when token format is invalid (only one part)", () => {
      req.headers = {
        authorization: "InvalidTokenWithoutBearer"
      }

      AuthMiddleware.authenticate(req as AuthenticatedRequest, res as Response, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ error: "Token error" })
      expect(next).not.toHaveBeenCalled()
      expect(tokenServiceSpy).not.toHaveBeenCalled()
    })

    it("should return 401 when token format has more than 2 parts", () => {
      req.headers = {
        authorization: "Bearer token extra_part"
      }

      AuthMiddleware.authenticate(req as AuthenticatedRequest, res as Response, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ error: "Token error" })
      expect(next).not.toHaveBeenCalled()
      expect(tokenServiceSpy).not.toHaveBeenCalled()
    })

    it("should return 401 when scheme is not Bearer", () => {
      req.headers = {
        authorization: `Basic ${validToken}`
      }

      AuthMiddleware.authenticate(req as AuthenticatedRequest, res as Response, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ error: "Token malformatted" })
      expect(next).not.toHaveBeenCalled()
      expect(tokenServiceSpy).not.toHaveBeenCalled()
    })

    it("should return 401 when token is invalid (TokenService throws error)", () => {
      tokenServiceSpy.mockImplementation(() => {
        throw new Error("Invalid token")
      })

      req.headers = {
        authorization: `Bearer ${validToken}`
      }

      AuthMiddleware.authenticate(req as AuthenticatedRequest, res as Response, next)

      expect(tokenServiceSpy).toHaveBeenCalledWith(validToken)
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" })
      expect(next).not.toHaveBeenCalled()
    })

    it("should return 401 when token verification fails with jwt error", () => {
      tokenServiceSpy.mockImplementation(() => {
        throw new Error("JsonWebTokenError: invalid signature")
      })

      req.headers = {
        authorization: `Bearer ${validToken}`
      }

      AuthMiddleware.authenticate(req as AuthenticatedRequest, res as Response, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" })
      expect(next).not.toHaveBeenCalled()
    })

    it("should return 401 when token is expired", () => {
      tokenServiceSpy.mockImplementation(() => {
        throw new Error("TokenExpiredError: jwt expired")
      })

      req.headers = {
        authorization: `Bearer ${validToken}`
      }

      AuthMiddleware.authenticate(req as AuthenticatedRequest, res as Response, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" })
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe("Edge cases", () => {
    it("should handle empty token string", () => {
      tokenServiceSpy.mockImplementation(() => {
        throw new Error("jwt malformed")
      })

      req.headers = {
        authorization: "Bearer "
      }

      AuthMiddleware.authenticate(req as AuthenticatedRequest, res as Response, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid token" })
      expect(next).not.toHaveBeenCalled()
    })

    it("should handle whitespace in authorization header", () => {
      req.headers = {
        authorization: "   Bearer    token   "
      }

      AuthMiddleware.authenticate(req as AuthenticatedRequest, res as Response, next)

      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ error: "Token error" })
      expect(next).not.toHaveBeenCalled()
    })

    it("should not attach userId if token service fails before getting userId", () => {
      tokenServiceSpy.mockImplementation(() => {
        throw new Error("Token decode error")
      })

      req.headers = {
        authorization: `Bearer ${validToken}`
      }

      AuthMiddleware.authenticate(req as AuthenticatedRequest, res as Response, next)

      expect(req.userId).toBeUndefined()
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe("Integration with TokenService", () => {
    it("should correctly pass token to TokenService.getUserIdFromToken", () => {
      const specificToken = "specific_test_token_xyz"
      tokenServiceSpy.mockReturnValue(mockUserId)

      req.headers = {
        authorization: `Bearer ${specificToken}`
      }

      AuthMiddleware.authenticate(req as AuthenticatedRequest, res as Response, next)

      expect(tokenServiceSpy).toHaveBeenCalledTimes(1)
      expect(tokenServiceSpy).toHaveBeenCalledWith(specificToken)
    })

    it("should convert Id object to string when attaching to request", () => {
      const customUserId = Id.generate()
      tokenServiceSpy.mockReturnValue(customUserId)

      req.headers = {
        authorization: `Bearer ${validToken}`
      }

      AuthMiddleware.authenticate(req as AuthenticatedRequest, res as Response, next)

      expect(req.userId).toBe(customUserId.toString())
      expect(typeof req.userId).toBe("string")
    })
  })
})

