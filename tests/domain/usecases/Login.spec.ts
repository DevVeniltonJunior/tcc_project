import { Login } from "@/domain/usecases/auth/Login"
import { User, Password } from "@/domain/entities"
import { IUserQueryRepository, IPasswordQueryRepository } from "@/domain/protocols"
import { Id, Name, DateEpoch, Email, PasswordHash, Bool } from "@/domain/valueObjects"
import { TokenService } from "@/infra/utils/TokenService"
import { PasswordHasher } from "@/infra/utils/PasswordHasher"

// Mock PasswordHasher static method
jest.mock("@/infra/utils/PasswordHasher")

class UserQueryRepositoryStub implements IUserQueryRepository {
  public get = jest.fn<Promise<User>, [Id]>(async (_id: Id) => {
    throw new Error("Not implemented")
  })

  public getByEmail = jest.fn<Promise<User>, [Email]>(async (_email: Email) => {
    throw new Error("Not implemented")
  })

  public find = jest.fn<Promise<User>, [any?]>(async (_filters?: any) => {
    throw new Error("Not implemented")
  })

  public list = jest.fn<Promise<User[]>, [any?]>(async (_filters?: any) => {
    throw new Error("Not implemented")
  })
}

class PasswordQueryRepositoryStub implements IPasswordQueryRepository {
  public get = jest.fn<Promise<Password>, [Id]>(async (_id: Id) => {
    throw new Error("Not implemented")
  })

  public find = jest.fn<Promise<Password>, [any?]>(async (_filters?: any) => {
    throw new Error("Not implemented")
  })

  public list = jest.fn<Promise<Password[]>, [any?]>(async (_filters?: any) => {
    throw new Error("Not implemented")
  })
}

describe("[Usecases] Login", () => {
  let userQueryRepository: UserQueryRepositoryStub
  let passwordQueryRepository: PasswordQueryRepositoryStub
  let tokenService: jest.Mocked<TokenService>
  let loginUsecase: Login
  let user: User
  let password: Password
  let email: Email
  let passwordString: string

  beforeEach(() => {
    userQueryRepository = new UserQueryRepositoryStub()
    passwordQueryRepository = new PasswordQueryRepositoryStub()

    // Mock TokenService
    tokenService = {
      generateTokenForUser: jest.fn(),
      validateToken: jest.fn()
    } as unknown as jest.Mocked<TokenService>

    loginUsecase = new Login(
      userQueryRepository,
      passwordQueryRepository,
      tokenService
    )

    // Create test data
    const userId = Id.generate()
    email = new Email("john.doe@example.com")
    passwordString = "Password123!"

    user = new User(
      userId,
      new Name("John Doe"),
      new DateEpoch(Date.now() - 1000 * 60 * 60 * 24 * 365 * 25), // 25 years ago
      email,
      new DateEpoch(Date.now())
    )

    password = new Password(
      Id.generate(),
      userId,
      new PasswordHash("$2b$10$hashedPasswordExample"),
      new Bool(true),
      new DateEpoch(Date.now())
    )

    // Reset all mocks
    jest.clearAllMocks()
  })

  it("should successfully login with valid credentials", async () => {
    // Arrange
    const mockToken = "mock-jwt-token-123"
    userQueryRepository.getByEmail.mockResolvedValue(user)
    passwordQueryRepository.find.mockResolvedValue(password)
    ;(PasswordHasher.verifyPassword as jest.Mock).mockResolvedValue(true)
    tokenService.generateTokenForUser.mockReturnValue(mockToken)

    // Act
    const result = await loginUsecase.execute(email, passwordString)

    // Assert
    expect(userQueryRepository.getByEmail).toHaveBeenCalledWith(email)
    expect(userQueryRepository.getByEmail).toHaveBeenCalledTimes(1)

    expect(passwordQueryRepository.find).toHaveBeenCalledWith({
      userId: user.getId().toString(),
      active: true
    })
    expect(passwordQueryRepository.find).toHaveBeenCalledTimes(1)

    expect(PasswordHasher.verifyPassword).toHaveBeenCalledWith(
      passwordString,
      password.getPassword().toString()
    )
    expect(PasswordHasher.verifyPassword).toHaveBeenCalledTimes(1)

    expect(tokenService.generateTokenForUser).toHaveBeenCalledWith(user.getId())
    expect(tokenService.generateTokenForUser).toHaveBeenCalledTimes(1)

    expect(result).toEqual({
      user: user,
      token: mockToken
    })
  })

  it("should throw error when user password is not found", async () => {
    // Arrange
    userQueryRepository.getByEmail.mockResolvedValue(user)
    passwordQueryRepository.find.mockResolvedValue(null as any)

    // Act & Assert
    await expect(loginUsecase.execute(email, passwordString)).rejects.toThrow(
      "User password not found"
    )

    expect(userQueryRepository.getByEmail).toHaveBeenCalledWith(email)
    expect(passwordQueryRepository.find).toHaveBeenCalledWith({
      userId: user.getId().toString(),
      active: true
    })

    // Should not verify password or generate token
    expect(PasswordHasher.verifyPassword).not.toHaveBeenCalled()
    expect(tokenService.generateTokenForUser).not.toHaveBeenCalled()
  })

  it("should throw error when password is invalid", async () => {
    // Arrange
    userQueryRepository.getByEmail.mockResolvedValue(user)
    passwordQueryRepository.find.mockResolvedValue(password)
    ;(PasswordHasher.verifyPassword as jest.Mock).mockResolvedValue(false)

    // Act & Assert
    await expect(loginUsecase.execute(email, passwordString)).rejects.toThrow(
      "Invalid credentials"
    )

    expect(userQueryRepository.getByEmail).toHaveBeenCalledWith(email)
    expect(passwordQueryRepository.find).toHaveBeenCalledWith({
      userId: user.getId().toString(),
      active: true
    })
    expect(PasswordHasher.verifyPassword).toHaveBeenCalledWith(
      passwordString,
      password.getPassword().toString()
    )

    // Should not generate token if password is invalid
    expect(tokenService.generateTokenForUser).not.toHaveBeenCalled()
  })

  it("should search for active password only", async () => {
    // Arrange
    const mockToken = "mock-token"
    userQueryRepository.getByEmail.mockResolvedValue(user)
    passwordQueryRepository.find.mockResolvedValue(password)
    ;(PasswordHasher.verifyPassword as jest.Mock).mockResolvedValue(true)
    tokenService.generateTokenForUser.mockReturnValue(mockToken)

    // Act
    await loginUsecase.execute(email, passwordString)

    // Assert
    expect(passwordQueryRepository.find).toHaveBeenCalledWith({
      userId: user.getId().toString(),
      active: true
    })
  })

  it("should propagate error when user repository fails", async () => {
    // Arrange
    const dbError = new Error("Database connection failed")
    userQueryRepository.getByEmail.mockRejectedValue(dbError)

    // Act & Assert
    await expect(loginUsecase.execute(email, passwordString)).rejects.toThrow(
      "Database connection failed"
    )

    expect(userQueryRepository.getByEmail).toHaveBeenCalledWith(email)

    // Should not proceed if user query fails
    expect(passwordQueryRepository.find).not.toHaveBeenCalled()
    expect(PasswordHasher.verifyPassword).not.toHaveBeenCalled()
    expect(tokenService.generateTokenForUser).not.toHaveBeenCalled()
  })

  it("should propagate error when password repository fails", async () => {
    // Arrange
    const dbError = new Error("Password query failed")
    userQueryRepository.getByEmail.mockResolvedValue(user)
    passwordQueryRepository.find.mockRejectedValue(dbError)

    // Act & Assert
    await expect(loginUsecase.execute(email, passwordString)).rejects.toThrow(
      "Password query failed"
    )

    expect(userQueryRepository.getByEmail).toHaveBeenCalledWith(email)
    expect(passwordQueryRepository.find).toHaveBeenCalledWith({
      userId: user.getId().toString(),
      active: true
    })

    // Should not proceed if password query fails
    expect(PasswordHasher.verifyPassword).not.toHaveBeenCalled()
    expect(tokenService.generateTokenForUser).not.toHaveBeenCalled()
  })

  it("should propagate error when password verification fails", async () => {
    // Arrange
    const hashError = new Error("Hash verification error")
    userQueryRepository.getByEmail.mockResolvedValue(user)
    passwordQueryRepository.find.mockResolvedValue(password)
    ;(PasswordHasher.verifyPassword as jest.Mock).mockRejectedValue(hashError)

    // Act & Assert
    await expect(loginUsecase.execute(email, passwordString)).rejects.toThrow(
      "Hash verification error"
    )

    expect(userQueryRepository.getByEmail).toHaveBeenCalledWith(email)
    expect(passwordQueryRepository.find).toHaveBeenCalledWith({
      userId: user.getId().toString(),
      active: true
    })
    expect(PasswordHasher.verifyPassword).toHaveBeenCalledWith(
      passwordString,
      password.getPassword().toString()
    )

    // Should not generate token if verification fails
    expect(tokenService.generateTokenForUser).not.toHaveBeenCalled()
  })

  it("should generate token with correct user ID", async () => {
    // Arrange
    const mockToken = "generated-token-xyz"
    const customUserId = Id.generate()
    const customUser = new User(
      customUserId,
      new Name("Jane Doe"),
      new DateEpoch(Date.now() - 1000 * 60 * 60 * 24 * 365 * 30),
      new Email("jane@example.com"),
      new DateEpoch(Date.now())
    )
    const customPassword = new Password(
      Id.generate(),
      customUserId,
      new PasswordHash("$2b$10$anotherHashedPassword"),
      new Bool(true),
      new DateEpoch(Date.now())
    )

    userQueryRepository.getByEmail.mockResolvedValue(customUser)
    passwordQueryRepository.find.mockResolvedValue(customPassword)
    ;(PasswordHasher.verifyPassword as jest.Mock).mockResolvedValue(true)
    tokenService.generateTokenForUser.mockReturnValue(mockToken)

    // Act
    const result = await loginUsecase.execute(new Email("jane@example.com"), "password")

    // Assert
    expect(tokenService.generateTokenForUser).toHaveBeenCalledWith(customUserId)
    expect(result.token).toBe(mockToken)
    expect(result.user).toBe(customUser)
  })

  it("should return the correct user object", async () => {
    // Arrange
    const mockToken = "token"
    userQueryRepository.getByEmail.mockResolvedValue(user)
    passwordQueryRepository.find.mockResolvedValue(password)
    ;(PasswordHasher.verifyPassword as jest.Mock).mockResolvedValue(true)
    tokenService.generateTokenForUser.mockReturnValue(mockToken)

    // Act
    const result = await loginUsecase.execute(email, passwordString)

    // Assert
    expect(result.user).toBe(user)
    expect(result.user.getId()).toBe(user.getId())
    expect(result.user.getEmail()).toBe(user.getEmail())
    expect(result.user.getName()).toBe(user.getName())
  })

  it("should handle different email addresses correctly", async () => {
    // Arrange
    const differentEmail = new Email("different@example.com")
    const mockToken = "token"
    userQueryRepository.getByEmail.mockResolvedValue(user)
    passwordQueryRepository.find.mockResolvedValue(password)
    ;(PasswordHasher.verifyPassword as jest.Mock).mockResolvedValue(true)
    tokenService.generateTokenForUser.mockReturnValue(mockToken)

    // Act
    await loginUsecase.execute(differentEmail, passwordString)

    // Assert
    expect(userQueryRepository.getByEmail).toHaveBeenCalledWith(differentEmail)
  })

  it("should handle different passwords correctly", async () => {
    // Arrange
    const differentPassword = "DifferentPassword456!"
    const mockToken = "token"
    userQueryRepository.getByEmail.mockResolvedValue(user)
    passwordQueryRepository.find.mockResolvedValue(password)
    ;(PasswordHasher.verifyPassword as jest.Mock).mockResolvedValue(true)
    tokenService.generateTokenForUser.mockReturnValue(mockToken)

    // Act
    await loginUsecase.execute(email, differentPassword)

    // Assert
    expect(PasswordHasher.verifyPassword).toHaveBeenCalledWith(
      differentPassword,
      password.getPassword().toString()
    )
  })
})

