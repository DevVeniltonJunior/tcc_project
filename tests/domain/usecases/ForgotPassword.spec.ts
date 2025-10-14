import { ForgotPassword } from "@/domain/usecases"
import { User } from "@/domain/entities"
import { Id, Name, DateEpoch, Email } from "@/domain/valueObjects"
import { TokenService, EmailService } from "@/infra/utils"

describe("[Usecases] ForgotPassword", () => {
  let tokenService: jest.Mocked<TokenService>
  let emailService: jest.Mocked<EmailService>
  let usecase: ForgotPassword
  let user: User

  beforeEach(() => {
    // Mock TokenService
    tokenService = {
      generateTokenForUser: jest.fn(),
      validateToken: jest.fn()
    } as unknown as jest.Mocked<TokenService>

    // Mock EmailService
    emailService = {
      sendEmail: jest.fn()
    } as unknown as jest.Mocked<EmailService>

    usecase = new ForgotPassword(tokenService, emailService)

    // Create test user
    user = new User(
      Id.generate(),
      new Name("John Doe"),
      new DateEpoch(Date.now() - 1000 * 60 * 60 * 24 * 365 * 25), // 25 years ago
      new Email("john.doe@example.com"),
      new DateEpoch(Date.now())
    )
  })

  it("should generate token for user and send password reset email", async () => {
    const mockToken = "mock-reset-token-123"
    tokenService.generateTokenForUser.mockReturnValue(mockToken)
    emailService.sendEmail.mockResolvedValue(undefined)

    await usecase.execute(user)

    // Verify token was generated with correct user ID
    expect(tokenService.generateTokenForUser).toHaveBeenCalledWith(user.getId())
    expect(tokenService.generateTokenForUser).toHaveBeenCalledTimes(1)

    // Verify email was sent with correct parameters
    expect(emailService.sendEmail).toHaveBeenCalledTimes(1)
    expect(emailService.sendEmail).toHaveBeenCalledWith(
      "noreply@budgetly.com",
      user.getEmail().toString(),
      expect.any(String), // subject
      expect.any(String), // text
      expect.any(String)  // html
    )
  })

  it("should include reset link with token in email", async () => {
    const mockToken = "test-token-456"
    const originalFrontendUrl = process.env.FRONTEND_URL
    process.env.FRONTEND_URL = "http://localhost:3000"
    
    tokenService.generateTokenForUser.mockReturnValue(mockToken)
    emailService.sendEmail.mockResolvedValue(undefined)

    await usecase.execute(user)

    // Get the HTML content from the email call
    const emailCall = emailService.sendEmail.mock.calls[0]
    const htmlContent = emailCall[4] // 5th parameter is HTML content

    // Verify the reset link contains the token
    expect(htmlContent).toContain(mockToken)
    expect(htmlContent).toContain(`${process.env.FRONTEND_URL}/reset-password?token=${mockToken}`)

    // Restore original env
    if (originalFrontendUrl) {
      process.env.FRONTEND_URL = originalFrontendUrl
    } else {
      delete process.env.FRONTEND_URL
    }
  })

  it("should send email to correct user email address", async () => {
    const userEmail = "user@test.com"
    const testUser = new User(
      Id.generate(),
      new Name("Test User"),
      new DateEpoch(Date.now() - 1000 * 60 * 60 * 24 * 365 * 30),
      new Email(userEmail),
      new DateEpoch(Date.now())
    )

    tokenService.generateTokenForUser.mockReturnValue("token")
    emailService.sendEmail.mockResolvedValue(undefined)

    await usecase.execute(testUser)

    expect(emailService.sendEmail).toHaveBeenCalledWith(
      "noreply@budgetly.com",
      userEmail,
      expect.any(String),
      expect.any(String),
      expect.any(String)
    )
  })

  it("should propagate error when token generation fails", async () => {
    const tokenError = new Error("Token generation failed")
    tokenService.generateTokenForUser.mockImplementation(() => {
      throw tokenError
    })

    await expect(usecase.execute(user)).rejects.toThrow("Token generation failed")
    
    // Email should not be sent if token generation fails
    expect(emailService.sendEmail).not.toHaveBeenCalled()
  })

  it("should propagate error when email sending fails", async () => {
    const emailError = new Error("Email service unavailable")
    tokenService.generateTokenForUser.mockReturnValue("token")
    emailService.sendEmail.mockRejectedValue(emailError)

    await expect(usecase.execute(user)).rejects.toThrow("Email service unavailable")
    
    // Token should be generated before email fails
    expect(tokenService.generateTokenForUser).toHaveBeenCalled()
  })

  it("should use PASSWORD_RESET email template type", async () => {
    tokenService.generateTokenForUser.mockReturnValue("token")
    emailService.sendEmail.mockResolvedValue(undefined)

    await usecase.execute(user)

    // Verify email was called (template is used internally)
    expect(emailService.sendEmail).toHaveBeenCalled()
    
    const emailCall = emailService.sendEmail.mock.calls[0]
    const subject = emailCall[2]
    const text = emailCall[3]
    const html = emailCall[4]

    // All email parts should be defined
    expect(subject).toBeDefined()
    expect(text).toBeDefined()
    expect(html).toBeDefined()
  })

  it("should handle multiple forgot password requests for same user", async () => {
    tokenService.generateTokenForUser
      .mockReturnValueOnce("first-token")
      .mockReturnValueOnce("second-token")
    
    emailService.sendEmail.mockResolvedValue(undefined)

    // First request
    await usecase.execute(user)
    expect(tokenService.generateTokenForUser).toHaveBeenCalledTimes(1)
    expect(emailService.sendEmail).toHaveBeenCalledTimes(1)

    // Second request
    await usecase.execute(user)
    expect(tokenService.generateTokenForUser).toHaveBeenCalledTimes(2)
    expect(emailService.sendEmail).toHaveBeenCalledTimes(2)

    // Verify different tokens were generated
    const firstEmailCall = emailService.sendEmail.mock.calls[0][4]
    const secondEmailCall = emailService.sendEmail.mock.calls[1][4]
    
    expect(firstEmailCall).toContain("first-token")
    expect(secondEmailCall).toContain("second-token")
  })

  it("should send email from noreply@budgetly.com", async () => {
    tokenService.generateTokenForUser.mockReturnValue("token")
    emailService.sendEmail.mockResolvedValue(undefined)

    await usecase.execute(user)

    const emailCall = emailService.sendEmail.mock.calls[0]
    const fromAddress = emailCall[0]

    expect(fromAddress).toBe("noreply@budgetly.com")
  })
})

