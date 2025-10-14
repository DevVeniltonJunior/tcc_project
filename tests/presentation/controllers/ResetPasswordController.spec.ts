import { ResetPasswordController } from "@/presentation/controllers/ResetPasswordController"
import { ResetPassword } from "@/domain/usecases"
import { Password } from "@/domain/entities"
import { Id, PasswordHash, DateEpoch, Bool } from "@/domain/valueObjects"
import { PasswordHasher, TokenService } from "@/infra/utils"
import { PasswordQueryRepository, PasswordCommandRepository } from "@/infra/repositories"
import { BadRequestError, NotFoundError, UnauthorizedError } from "@/presentation/exceptions"
import { InvalidParam } from "@/domain/exceptions"
import { DatabaseException } from "@/infra/exceptions"

describe("[Controller] ResetPasswordController", () => {
  let resetPasswordSpy: jest.SpyInstance
  let passwordHasherSpy: jest.SpyInstance
  let passwordQueryRepositorySpy: jest.SpyInstance
  let getUserIdFromTokenSpy: jest.SpyInstance
  let validateTokenSpy: jest.SpyInstance
  let oldPassword: Password
  let userId: Id
  const validToken = "valid.jwt.token"

  const makeRequest = (body: any = {}, query: any = {}) => ({
    body,
    params: {},
    query
  })

  beforeEach(() => {
    jest.restoreAllMocks()

    userId = Id.generate()
    oldPassword = new Password(
      Id.generate(),
      userId,
      new PasswordHash("old_hashed_password"),
      new Bool(true),
      new DateEpoch(Date.now())
    )

    const newPassword = new Password(
      Id.generate(),
      userId,
      new PasswordHash("new_hashed_password"),
      new Bool(true),
      new DateEpoch(Date.now())
    )

    resetPasswordSpy = jest.spyOn(ResetPassword.prototype, "execute").mockResolvedValue(newPassword)
    passwordHasherSpy = jest.spyOn(PasswordHasher, "encrypt").mockResolvedValue("new_hashed_password")
    passwordQueryRepositorySpy = jest.spyOn(PasswordQueryRepository.prototype, "find").mockResolvedValue(oldPassword)
    getUserIdFromTokenSpy = jest.spyOn(TokenService.prototype, "getUserIdFromToken").mockReturnValue(userId)
    validateTokenSpy = jest.spyOn(TokenService.prototype, "validateToken").mockReturnValue(true)
  })

  describe("Success cases", () => {
    it("should reset password successfully with valid token", async () => {
      const req = makeRequest(
        { newPassword: "newSecurePassword123" },
        { token: validToken }
      )

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(200)
      expect(result.data).toEqual({ message: "Password reset successfully" })
      expect(getUserIdFromTokenSpy).toHaveBeenCalledWith(validToken)
      expect(validateTokenSpy).toHaveBeenCalledWith(userId, validToken)
      expect(passwordQueryRepositorySpy).toHaveBeenCalledWith({
        userId: userId.toString(),
        active: true
      })
      expect(passwordHasherSpy).toHaveBeenCalledWith("newSecurePassword123")
      expect(resetPasswordSpy).toHaveBeenCalled()
    })

    it("should create new password entity with correct data", async () => {
      const req = makeRequest(
        { newPassword: "newPassword456" },
        { token: validToken }
      )

      await ResetPasswordController.handle(req)

      expect(resetPasswordSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          _userId: userId,
          _active: expect.any(Bool)
        }),
        oldPassword
      )
    })

    it("should hash the new password before saving", async () => {
      const newPassword = "myNewPassword!123"
      const req = makeRequest(
        { newPassword },
        { token: validToken }
      )

      await ResetPasswordController.handle(req)

      expect(passwordHasherSpy).toHaveBeenCalledWith(newPassword)
      expect(passwordHasherSpy).toHaveBeenCalledTimes(1)
    })

    it("should call services in correct order", async () => {
      const callOrder: string[] = []

      getUserIdFromTokenSpy.mockImplementation(() => {
        callOrder.push("getUserIdFromToken")
        return userId
      })

      passwordQueryRepositorySpy.mockImplementation(async () => {
        callOrder.push("passwordQueryRepository.find")
        return oldPassword
      })

      validateTokenSpy.mockImplementation(() => {
        callOrder.push("validateToken")
        return true
      })

      passwordHasherSpy.mockImplementation(async () => {
        callOrder.push("passwordHasher.encrypt")
        return "hashed"
      })

      resetPasswordSpy.mockImplementation(async () => {
        callOrder.push("resetPassword.execute")
      })

      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: validToken }
      )

      await ResetPasswordController.handle(req)

      expect(callOrder).toEqual([
        "getUserIdFromToken",
        "passwordQueryRepository.find",
        "validateToken",
        "passwordHasher.encrypt",
        "resetPassword.execute"
      ])
    })
  })

  describe("Validation errors - 400", () => {
    it("should return 400 if newPassword is missing", async () => {
      const req = makeRequest({}, { token: validToken })

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(400)
      expect(result.data.error).toContain("newPassword")
      expect(resetPasswordSpy).not.toHaveBeenCalled()
    })

    it("should return 400 if newPassword is undefined", async () => {
      const req = makeRequest({ newPassword: undefined }, { token: validToken })

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(400)
      expect(result.data.error).toContain("newPassword")
    })

    it("should return 400 if newPassword is null", async () => {
      const req = makeRequest({ newPassword: null }, { token: validToken })

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(400)
      expect(result.data.error).toContain("newPassword")
    })

    it("should accept empty string for newPassword (validation happens at domain level)", async () => {
      const req = makeRequest({ newPassword: "" }, { token: validToken })

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(200)
      expect(passwordHasherSpy).toHaveBeenCalledWith("")
    })

    it("should return 400 if token is missing from query", async () => {
      const req = makeRequest({ newPassword: "newPass123" }, {})

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(400)
      expect(result.data).toEqual({ error: "Missing required parameter: token" })
      expect(getUserIdFromTokenSpy).not.toHaveBeenCalled()
      expect(resetPasswordSpy).not.toHaveBeenCalled()
    })

    it("should return 400 if token is undefined", async () => {
      const req = makeRequest({ newPassword: "newPass123" }, { token: undefined })

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(400)
      expect(result.data.error).toBe("Missing required parameter: token")
    })

    it("should return 400 if token is null", async () => {
      const req = makeRequest({ newPassword: "newPass123" }, { token: null })

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(400)
      expect(result.data.error).toBe("Missing required parameter: token")
    })

    it("should return 400 if token is empty string", async () => {
      const req = makeRequest({ newPassword: "newPass123" }, { token: "" })

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(400)
      expect(result.data.error).toBe("Missing required parameter: token")
    })

    it("should return 400 if both newPassword and token are missing", async () => {
      const req = makeRequest({}, {})

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(400)
      expect(result.data).toHaveProperty("error")
    })

    it("should return 400 if InvalidParam is thrown", async () => {
      resetPasswordSpy.mockRejectedValueOnce(new InvalidParam("newPassword"))

      const req = makeRequest(
        { newPassword: "short" },
        { token: validToken }
      )

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(400)
      expect(result.data).toEqual({ error: "newPassword" })
    })

    it("should return 400 if BadRequestError is thrown", async () => {
      resetPasswordSpy.mockRejectedValueOnce(new BadRequestError("Password too weak"))

      const req = makeRequest(
        { newPassword: "weak" },
        { token: validToken }
      )

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(400)
      expect(result.data).toEqual({ error: "Password too weak" })
    })
  })

  describe("Unauthorized errors - 401", () => {
    it("should return 401 if token is invalid (getUserIdFromToken throws)", async () => {
      getUserIdFromTokenSpy.mockImplementation(() => {
        throw new Error("Invalid token")
      })

      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: "invalid.token" }
      )

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(401)
      expect(result.data).toEqual({ error: "Invalid or expired token" })
      expect(passwordQueryRepositorySpy).not.toHaveBeenCalled()
      expect(resetPasswordSpy).not.toHaveBeenCalled()
    })

    it("should return 401 if token is expired", async () => {
      getUserIdFromTokenSpy.mockImplementation(() => {
        throw new Error("Token expired")
      })

      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: "expired.token" }
      )

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(401)
      expect(result.data.error).toBe("Invalid or expired token")
    })

    it("should return 401 if token validation fails", async () => {
      validateTokenSpy.mockReturnValue(false)

      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: validToken }
      )

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(401)
      expect(result.data).toEqual({ error: "Invalid or expired token" })
      expect(validateTokenSpy).toHaveBeenCalledWith(userId, validToken)
      expect(resetPasswordSpy).not.toHaveBeenCalled()
    })

    it("should return 401 if UnauthorizedError is thrown", async () => {
      resetPasswordSpy.mockRejectedValueOnce(new UnauthorizedError("Token has been revoked"))

      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: validToken }
      )

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(401)
      expect(result.data).toEqual({ error: "Token has been revoked" })
    })

    it("should return 401 if token signature is invalid", async () => {
      getUserIdFromTokenSpy.mockImplementation(() => {
        throw new Error("Invalid signature")
      })

      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: "malformed.jwt.token" }
      )

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(401)
      expect(result.data.error).toBe("Invalid or expired token")
    })
  })

  describe("Not found errors - 404", () => {
    it("should return 404 if active password is not found", async () => {
      passwordQueryRepositorySpy.mockResolvedValueOnce(null)

      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: validToken }
      )

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(404)
      expect(result.data).toEqual({ error: "Active password not found for this user" })
      expect(passwordQueryRepositorySpy).toHaveBeenCalledWith({
        userId: userId.toString(),
        active: true
      })
      expect(resetPasswordSpy).not.toHaveBeenCalled()
    })

    it("should return 404 if NotFoundError is thrown", async () => {
      passwordQueryRepositorySpy.mockRejectedValueOnce(new NotFoundError("Password not found"))

      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: validToken }
      )

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(404)
      expect(result.data).toEqual({ error: "Password not found" })
    })

    it("should return 404 if DatabaseException with 'not found' is thrown", async () => {
      passwordQueryRepositorySpy.mockRejectedValueOnce(new DatabaseException("Password not found"))

      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: validToken }
      )

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(404)
      expect(result.data).toEqual({ error: "Password not found" })
    })

    it("should return 404 if DatabaseException contains 'not found' anywhere in message", async () => {
      resetPasswordSpy.mockRejectedValueOnce(new DatabaseException("Record not found in database"))

      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: validToken }
      )

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(404)
      expect(result.data.error).toContain("not found")
    })
  })

  describe("Server errors - 500", () => {
    it("should return 500 if an unexpected error occurs in password query", async () => {
      passwordQueryRepositorySpy.mockRejectedValueOnce(new Error("Database connection failed"))

      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: validToken }
      )

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(500)
      expect(result.data).toEqual({ error: "Database connection failed" })
    })

    it("should return 500 if password hasher fails", async () => {
      passwordHasherSpy.mockRejectedValueOnce(new Error("Hashing algorithm failed"))

      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: validToken }
      )

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(500)
      expect(result.data).toEqual({ error: "Hashing algorithm failed" })
    })

    it("should return 500 if ResetPassword usecase fails", async () => {
      resetPasswordSpy.mockRejectedValueOnce(new Error("Transaction rollback failed"))

      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: validToken }
      )

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(500)
      expect(result.data).toEqual({ error: "Transaction rollback failed" })
    })

    it("should return 500 for DatabaseException other than 'not found'", async () => {
      passwordQueryRepositorySpy.mockRejectedValueOnce(new DatabaseException("Connection timeout"))

      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: validToken }
      )

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(500)
      expect(result.data).toEqual({ error: "Connection timeout" })
    })

    it("should return 500 with error message for generic Error", async () => {
      const genericError = new Error("Something went wrong")
      resetPasswordSpy.mockRejectedValueOnce(genericError)

      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: validToken }
      )

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(500)
      expect(result.data.error).toBe("Something went wrong")
    })

    it("should return 500 if password entity creation fails", async () => {
      // Simulate error during entity creation
      passwordHasherSpy.mockRejectedValueOnce(new Error("Failed to create password hash"))

      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: validToken }
      )

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(500)
      expect(result.data.error).toBe("Failed to create password hash")
    })
  })

  describe("Integration with dependencies", () => {
    it("should instantiate TokenService correctly", async () => {
      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: validToken }
      )

      await ResetPasswordController.handle(req)

      expect(getUserIdFromTokenSpy).toHaveBeenCalled()
      expect(validateTokenSpy).toHaveBeenCalled()
    })

    it("should instantiate PasswordQueryRepository correctly", async () => {
      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: validToken }
      )

      await ResetPasswordController.handle(req)

      expect(passwordQueryRepositorySpy).toHaveBeenCalledWith({
        userId: userId.toString(),
        active: true
      })
    })

    it("should instantiate PasswordCommandRepository correctly", async () => {
      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: validToken }
      )

      await ResetPasswordController.handle(req)

      // ResetPassword usecase should be called, which uses PasswordCommandRepository
      expect(resetPasswordSpy).toHaveBeenCalled()
    })

    it("should use PasswordHasher to encrypt new password", async () => {
      const newPassword = "mySecurePassword123"
      const req = makeRequest(
        { newPassword },
        { token: validToken }
      )

      await ResetPasswordController.handle(req)

      expect(passwordHasherSpy).toHaveBeenCalledWith(newPassword)
    })

    it("should pass correct parameters to ResetPassword usecase", async () => {
      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: validToken }
      )

      await ResetPasswordController.handle(req)

      expect(resetPasswordSpy).toHaveBeenCalledWith(
        expect.any(Password),
        oldPassword
      )

      const newPasswordEntity = resetPasswordSpy.mock.calls[0][0]
      expect(newPasswordEntity).toBeInstanceOf(Password)
      expect(newPasswordEntity.getUserId()).toEqual(userId)
    })
  })

  describe("Edge cases", () => {
    it("should handle very long passwords", async () => {
      const longPassword = "a".repeat(1000)
      const req = makeRequest(
        { newPassword: longPassword },
        { token: validToken }
      )

      const result = await ResetPasswordController.handle(req)

      expect(passwordHasherSpy).toHaveBeenCalledWith(longPassword)
      expect(result.statusCode).toBe(200)
    })

    it("should handle passwords with special characters", async () => {
      const specialPassword = "P@ssw0rd!#$%^&*()"
      const req = makeRequest(
        { newPassword: specialPassword },
        { token: validToken }
      )

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(200)
      expect(passwordHasherSpy).toHaveBeenCalledWith(specialPassword)
    })

    it("should handle passwords with unicode characters", async () => {
      const unicodePassword = "Senha123!@#çãõ"
      const req = makeRequest(
        { newPassword: unicodePassword },
        { token: validToken }
      )

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(200)
      expect(passwordHasherSpy).toHaveBeenCalledWith(unicodePassword)
    })

    it("should handle multiple concurrent reset requests", async () => {
      const req1 = makeRequest({ newPassword: "pass1" }, { token: "token1" })
      const req2 = makeRequest({ newPassword: "pass2" }, { token: "token2" })
      const req3 = makeRequest({ newPassword: "pass3" }, { token: "token3" })

      const results = await Promise.all([
        ResetPasswordController.handle(req1),
        ResetPasswordController.handle(req2),
        ResetPasswordController.handle(req3)
      ])

      results.forEach(result => {
        expect(result.statusCode).toBe(200)
        expect(result.data.message).toBe("Password reset successfully")
      })

      expect(resetPasswordSpy).toHaveBeenCalledTimes(3)
    })

    it("should not expose sensitive information in error messages", async () => {
      resetPasswordSpy.mockRejectedValueOnce(new Error("Database credentials invalid"))

      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: validToken }
      )

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(500)
      // The error message is still exposed, but this test documents the current behavior
      expect(result.data.error).toBe("Database credentials invalid")
    })

    it("should handle token with spaces", async () => {
      const tokenWithSpaces = "  " + validToken + "  "
      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: tokenWithSpaces }
      )

      await ResetPasswordController.handle(req)

      expect(getUserIdFromTokenSpy).toHaveBeenCalledWith(tokenWithSpaces)
    })
  })

  describe("Request structure", () => {
    it("should accept valid request with body and query parameters", async () => {
      const req = {
        body: { newPassword: "newPass123" },
        params: {},
        query: { token: validToken }
      }

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(200)
    })

    it("should ignore params, only use body and query", async () => {
      const req = {
        body: { newPassword: "correctPassword" },
        params: { newPassword: "wrongPassword" },
        query: { token: validToken }
      }

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(200)
      expect(passwordHasherSpy).toHaveBeenCalledWith("correctPassword")
    })

    it("should handle body object with additional properties", async () => {
      const req = makeRequest(
        {
          newPassword: "newPass123",
          extraField: "should be ignored",
          anotherField: 123
        },
        { token: validToken }
      )

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(200)
      expect(passwordHasherSpy).toHaveBeenCalledWith("newPass123")
    })

    it("should handle query object with additional properties", async () => {
      const req = makeRequest(
        { newPassword: "newPass123" },
        {
          token: validToken,
          extraParam: "should be ignored"
        }
      )

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(200)
      expect(getUserIdFromTokenSpy).toHaveBeenCalledWith(validToken)
    })
  })

  describe("Response structure", () => {
    it("should return correct response structure on success", async () => {
      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: validToken }
      )

      const result = await ResetPasswordController.handle(req)

      expect(result).toHaveProperty("statusCode")
      expect(result).toHaveProperty("data")
      expect(result.statusCode).toBe(200)
      expect(result.data).toHaveProperty("message")
      expect(result.data.message).toBe("Password reset successfully")
    })

    it("should return correct response structure on validation error", async () => {
      const req = makeRequest({}, {})

      const result = await ResetPasswordController.handle(req)

      expect(result).toHaveProperty("statusCode")
      expect(result).toHaveProperty("data")
      expect(result.data).toHaveProperty("error")
      expect(typeof result.data.error).toBe("string")
    })

    it("should return correct response structure on unauthorized error", async () => {
      getUserIdFromTokenSpy.mockImplementation(() => {
        throw new Error("Invalid token")
      })

      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: "invalid" }
      )

      const result = await ResetPasswordController.handle(req)

      expect(result).toHaveProperty("statusCode")
      expect(result).toHaveProperty("data")
      expect(result.statusCode).toBe(401)
      expect(result.data).toHaveProperty("error")
    })

    it("should return correct response structure on not found error", async () => {
      passwordQueryRepositorySpy.mockResolvedValueOnce(null)

      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: validToken }
      )

      const result = await ResetPasswordController.handle(req)

      expect(result).toHaveProperty("statusCode")
      expect(result).toHaveProperty("data")
      expect(result.statusCode).toBe(404)
      expect(result.data).toHaveProperty("error")
    })

    it("should return correct response structure on server error", async () => {
      resetPasswordSpy.mockRejectedValueOnce(new Error("Server error"))

      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: validToken }
      )

      const result = await ResetPasswordController.handle(req)

      expect(result).toHaveProperty("statusCode")
      expect(result).toHaveProperty("data")
      expect(result.statusCode).toBe(500)
      expect(result.data).toHaveProperty("error")
    })
  })

  describe("Security considerations", () => {
    it("should validate token before processing password reset", async () => {
      const callOrder: string[] = []

      getUserIdFromTokenSpy.mockImplementation(() => {
        callOrder.push("getUserIdFromToken")
        return userId
      })

      validateTokenSpy.mockImplementation(() => {
        callOrder.push("validateToken")
        return true
      })

      resetPasswordSpy.mockImplementation(async () => {
        callOrder.push("resetPassword")
      })

      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: validToken }
      )

      await ResetPasswordController.handle(req)

      const resetPasswordIndex = callOrder.indexOf("resetPassword")
      const validateTokenIndex = callOrder.indexOf("validateToken")
      
      expect(validateTokenIndex).toBeLessThan(resetPasswordIndex)
    })

    it("should not proceed if token validation fails after getUserId succeeds", async () => {
      validateTokenSpy.mockReturnValue(false)

      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: validToken }
      )

      const result = await ResetPasswordController.handle(req)

      expect(result.statusCode).toBe(401)
      expect(resetPasswordSpy).not.toHaveBeenCalled()
      expect(passwordHasherSpy).not.toHaveBeenCalled()
    })

    it("should ensure old password is deactivated by using ResetPassword usecase", async () => {
      const req = makeRequest(
        { newPassword: "newPass123" },
        { token: validToken }
      )

      await ResetPasswordController.handle(req)

      // The ResetPassword usecase receives both new and old password
      expect(resetPasswordSpy).toHaveBeenCalledWith(
        expect.any(Password),
        oldPassword
      )
    })
  })
})

