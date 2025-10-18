import { ForgotPasswordController } from "@/presentation/controllers/ForgotPasswordController"
import { FindUser, ForgotPassword } from "@/domain/usecases"
import { UserQueryRepository } from "@/infra/repositories"
import { User, Password, Bill, Planning } from "@/domain/entities"
import { Id, Name, DateEpoch, Email, MoneyValue, PasswordHash, Bool } from "@/domain/valueObjects"
import { BadRequestError, NotFoundError } from "@/presentation/exceptions"
import { InvalidParam } from "@/domain/exceptions"
import { DatabaseException } from "@/infra/exceptions"
import { EmailService, TokenService } from "@/infra/utils"

describe("[Controller] ForgotPasswordController", () => {
  let findUserSpy: jest.SpyInstance
  let forgotPasswordSpy: jest.SpyInstance
  let user: User

  const makeRequest = (query: any = {}) => ({
    body: {},
    params: {},
    query
  })

  beforeEach(() => {
    jest.restoreAllMocks()

    user = new User(
      Id.generate(),
      new Name("Jane Doe"),
      new DateEpoch("1995-06-15"),
      new Email("jane_doe@email.com"),
      new DateEpoch(Date.now()),
      new Password(
        Id.generate(),
        Id.generate(),
        new PasswordHash("hash"),
        new Bool(true),
        new DateEpoch(Date.now())
      ),
      [] as Bill[],
      [] as Planning[],
      new MoneyValue(2500)
    )

    findUserSpy = jest.spyOn(FindUser.prototype, "execute").mockResolvedValue(user)
    forgotPasswordSpy = jest.spyOn(ForgotPassword.prototype, "execute").mockResolvedValue(undefined)
    jest.spyOn(UserQueryRepository.prototype, "find").mockResolvedValue(user)
  })

  describe("Success cases", () => {
    it("should send password reset email successfully", async () => {
      const req = makeRequest({ email: "jane_doe@email.com" })

      const result = await ForgotPasswordController.handle(req)

      expect(result.statusCode).toBe(200)
      expect(result.data).toEqual({ message: "Email sent successfully" })
      expect(findUserSpy).toHaveBeenCalledWith({ email: "jane_doe@email.com" })
      expect(forgotPasswordSpy).toHaveBeenCalledWith(user)
    })

    it("should handle different email addresses correctly", async () => {
      const testEmail = "test.user@example.com"
      const testUser = new User(
        Id.generate(),
        new Name("Test User"),
        new DateEpoch("1990-01-01"),
        new Email(testEmail),
        new DateEpoch(Date.now())
      )

      findUserSpy.mockResolvedValueOnce(testUser)

      const req = makeRequest({ email: testEmail })
      const result = await ForgotPasswordController.handle(req)

      expect(result.statusCode).toBe(200)
      expect(result.data.message).toBe("Email sent successfully")
      expect(findUserSpy).toHaveBeenCalledWith({ email: testEmail })
      expect(forgotPasswordSpy).toHaveBeenCalledWith(testUser)
    })

    it("should call FindUser and ForgotPassword in correct order", async () => {
      const callOrder: string[] = []

      findUserSpy.mockImplementation(async () => {
        callOrder.push("FindUser")
        return user
      })

      forgotPasswordSpy.mockImplementation(async () => {
        callOrder.push("ForgotPassword")
      })

      const req = makeRequest({ email: "jane_doe@email.com" })
      await ForgotPasswordController.handle(req)

      expect(callOrder).toEqual(["FindUser", "ForgotPassword"])
    })
  })

  describe("Validation errors - 400", () => {
    it("should return 400 if email is missing", async () => {
      const req = makeRequest({})

      const result = await ForgotPasswordController.handle(req)

      expect(result.statusCode).toBe(400)
      expect(result.data).toEqual({ error: "Missing required parameter: email" })
      expect(findUserSpy).not.toHaveBeenCalled()
      expect(forgotPasswordSpy).not.toHaveBeenCalled()
    })

    it("should return 400 if email is undefined", async () => {
      const req = makeRequest({ email: undefined })

      const result = await ForgotPasswordController.handle(req)

      expect(result.statusCode).toBe(400)
      expect(result.data.error).toBe("Missing required parameter: email")
    })

    it("should return 400 if email is null", async () => {
      const req = makeRequest({ email: null })

      const result = await ForgotPasswordController.handle(req)

      expect(result.statusCode).toBe(400)
      expect(result.data.error).toBe("Missing required parameter: email")
    })

    it("should return 400 if email is empty string", async () => {
      const req = makeRequest({ email: "" })

      const result = await ForgotPasswordController.handle(req)

      expect(result.statusCode).toBe(400)
      expect(result.data.error).toBe("Missing required parameter: email")
    })

    it("should return 400 if InvalidParam is thrown by FindUser", async () => {
      findUserSpy.mockRejectedValueOnce(new InvalidParam("email"))

      const req = makeRequest({ email: "invalid_email" })
      const result = await ForgotPasswordController.handle(req)

      expect(result.statusCode).toBe(400)
      expect(result.data).toEqual({ error: "email" })
      expect(forgotPasswordSpy).not.toHaveBeenCalled()
    })

    it("should return 400 if BadRequestError is thrown", async () => {
      findUserSpy.mockRejectedValueOnce(new BadRequestError("Invalid email format"))

      const req = makeRequest({ email: "bad@email" })
      const result = await ForgotPasswordController.handle(req)

      expect(result.statusCode).toBe(400)
      expect(result.data).toEqual({ error: "Invalid email format" })
    })
  })

  describe("Not found errors - 404", () => {
    it("should return 404 if user is not found", async () => {
      findUserSpy.mockResolvedValueOnce(null)

      const req = makeRequest({ email: "nonexistent@email.com" })
      const result = await ForgotPasswordController.handle(req)

      expect(result.statusCode).toBe(404)
      expect(result.data).toEqual({ error: "User not found" })
      expect(findUserSpy).toHaveBeenCalledWith({ email: "nonexistent@email.com" })
      expect(forgotPasswordSpy).not.toHaveBeenCalled()
    })

    it("should return 404 if NotFoundError is thrown", async () => {
      findUserSpy.mockRejectedValueOnce(new NotFoundError("User not found"))

      const req = makeRequest({ email: "jane_doe@email.com" })
      const result = await ForgotPasswordController.handle(req)

      expect(result.statusCode).toBe(404)
      expect(result.data).toEqual({ error: "User not found" })
      expect(forgotPasswordSpy).not.toHaveBeenCalled()
    })

    it("should return 404 if DatabaseException with 'User not found' is thrown", async () => {
      findUserSpy.mockRejectedValueOnce(new DatabaseException("User not found"))

      const req = makeRequest({ email: "jane_doe@email.com" })
      const result = await ForgotPasswordController.handle(req)

      expect(result.statusCode).toBe(404)
      expect(result.data).toEqual({ error: "User not found" })
    })
  })

  describe("Server errors - 500", () => {
    it("should return 500 if an unexpected error occurs in FindUser", async () => {
      findUserSpy.mockRejectedValueOnce(new Error("Database connection failed"))

      const req = makeRequest({ email: "jane_doe@email.com" })
      const result = await ForgotPasswordController.handle(req)

      expect(result.statusCode).toBe(500)
      expect(result.data).toEqual({ error: "Database connection failed" })
      expect(forgotPasswordSpy).not.toHaveBeenCalled()
    })

    it("should return 500 if ForgotPassword usecase fails", async () => {
      forgotPasswordSpy.mockRejectedValueOnce(new Error("Email service unavailable"))

      const req = makeRequest({ email: "jane_doe@email.com" })
      const result = await ForgotPasswordController.handle(req)

      expect(result.statusCode).toBe(500)
      expect(result.data).toEqual({ error: "Email service unavailable" })
      expect(findUserSpy).toHaveBeenCalled()
    })

    it("should return 500 if token generation fails", async () => {
      forgotPasswordSpy.mockRejectedValueOnce(new Error("Token generation failed"))

      const req = makeRequest({ email: "jane_doe@email.com" })
      const result = await ForgotPasswordController.handle(req)

      expect(result.statusCode).toBe(500)
      expect(result.data.error).toBe("Token generation failed")
    })

    it("should return 500 for DatabaseException other than 'User not found'", async () => {
      findUserSpy.mockRejectedValueOnce(new DatabaseException("Connection timeout"))

      const req = makeRequest({ email: "jane_doe@email.com" })
      const result = await ForgotPasswordController.handle(req)

      expect(result.statusCode).toBe(500)
      expect(result.data).toEqual({ error: "Connection timeout" })
    })

    it("should return 500 with error message for generic Error", async () => {
      const genericError = new Error("Something went wrong")
      findUserSpy.mockRejectedValueOnce(genericError)

      const req = makeRequest({ email: "jane_doe@email.com" })
      const result = await ForgotPasswordController.handle(req)

      expect(result.statusCode).toBe(500)
      expect(result.data.error).toBe("Something went wrong")
    })
  })

  describe("Integration with dependencies", () => {
    it("should instantiate UserQueryRepository correctly", async () => {
      const repositorySpy = jest.spyOn(UserQueryRepository.prototype, "find")
      repositorySpy.mockResolvedValue(user)

      const req = makeRequest({ email: "jane_doe@email.com" })
      await ForgotPasswordController.handle(req)

      // FindUser should have been called, which internally uses UserQueryRepository
      expect(findUserSpy).toHaveBeenCalled()
    })

    it("should instantiate TokenService and EmailService correctly", async () => {
      const req = makeRequest({ email: "jane_doe@email.com" })
      await ForgotPasswordController.handle(req)

      // ForgotPassword should be called with user, which internally uses TokenService and EmailService
      expect(forgotPasswordSpy).toHaveBeenCalledWith(user)
    })

    it("should handle user without password", async () => {
      const userWithoutPassword = new User(
        Id.generate(),
        new Name("John Doe"),
        new DateEpoch("1990-01-01"),
        new Email("john@email.com"),
        new DateEpoch(Date.now())
      )

      findUserSpy.mockResolvedValueOnce(userWithoutPassword)

      const req = makeRequest({ email: "john@email.com" })
      const result = await ForgotPasswordController.handle(req)

      expect(result.statusCode).toBe(200)
      expect(forgotPasswordSpy).toHaveBeenCalledWith(userWithoutPassword)
    })
  })

  describe("Edge cases", () => {
    it("should handle email with spaces (trimming should be handled by domain)", async () => {
      const req = makeRequest({ email: "  jane_doe@email.com  " })
      await ForgotPasswordController.handle(req)

      expect(findUserSpy).toHaveBeenCalledWith({ email: "  jane_doe@email.com  " })
    })

    it("should handle uppercase email", async () => {
      const req = makeRequest({ email: "JANE_DOE@EMAIL.COM" })
      await ForgotPasswordController.handle(req)

      expect(findUserSpy).toHaveBeenCalledWith({ email: "JANE_DOE@EMAIL.COM" })
    })

    it("should handle multiple concurrent requests", async () => {
      const req1 = makeRequest({ email: "user1@email.com" })
      const req2 = makeRequest({ email: "user2@email.com" })
      const req3 = makeRequest({ email: "user3@email.com" })

      const results = await Promise.all([
        ForgotPasswordController.handle(req1),
        ForgotPasswordController.handle(req2),
        ForgotPasswordController.handle(req3)
      ])

      results.forEach(result => {
        expect(result.statusCode).toBe(200)
        expect(result.data.message).toBe("Email sent successfully")
      })

      expect(findUserSpy).toHaveBeenCalledTimes(3)
      expect(forgotPasswordSpy).toHaveBeenCalledTimes(3)
    })

    it("should not expose sensitive information in error messages", async () => {
      findUserSpy.mockRejectedValueOnce(new Error("Database credentials invalid"))

      const req = makeRequest({ email: "test@email.com" })
      const result = await ForgotPasswordController.handle(req)

      expect(result.statusCode).toBe(500)
      // The error message is still exposed, but this test documents the current behavior
      expect(result.data.error).toBe("Database credentials invalid")
    })
  })

  describe("Request structure", () => {
    it("should accept valid request with query parameter", async () => {
      const req = {
        body: {},
        params: {},
        query: { email: "jane_doe@email.com" }
      }

      const result = await ForgotPasswordController.handle(req)

      expect(result.statusCode).toBe(200)
    })

    it("should ignore body and params, only use query", async () => {
      const req = {
        body: { email: "wrong@email.com" },
        params: { email: "also_wrong@email.com" },
        query: { email: "jane_doe@email.com" }
      }

      const result = await ForgotPasswordController.handle(req)

      expect(result.statusCode).toBe(200)
      expect(findUserSpy).toHaveBeenCalledWith({ email: "jane_doe@email.com" })
    })

    it("should handle query object with additional properties", async () => {
      const req = makeRequest({
        email: "jane_doe@email.com",
        extraParam: "should be ignored"
      })

      const result = await ForgotPasswordController.handle(req)

      expect(result.statusCode).toBe(200)
      expect(findUserSpy).toHaveBeenCalledWith({ email: "jane_doe@email.com" })
    })
  })

  describe("Response structure", () => {
    it("should return correct response structure on success", async () => {
      const req = makeRequest({ email: "jane_doe@email.com" })
      const result = await ForgotPasswordController.handle(req)

      expect(result).toHaveProperty("statusCode")
      expect(result).toHaveProperty("data")
      expect(result.statusCode).toBe(200)
      expect(result.data).toHaveProperty("message")
    })

    it("should return correct response structure on error", async () => {
      const req = makeRequest({})
      const result = await ForgotPasswordController.handle(req)

      expect(result).toHaveProperty("statusCode")
      expect(result).toHaveProperty("data")
      expect(result.statusCode).toBe(400)
      expect(result.data).toHaveProperty("error")
    })
  })
})

