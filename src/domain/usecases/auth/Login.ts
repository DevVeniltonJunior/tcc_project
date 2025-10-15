import { User } from "@/domain/entities"
import { ILogin, IPasswordQueryRepository } from "@/domain/protocols"
import { IUserQueryRepository } from "@/domain/protocols"
import { Email } from "@/domain/valueObjects"
import { PasswordHasher } from "@/infra/utils/PasswordHasher"
import { TokenService } from "@/infra/utils/TokenService"

export class Login implements ILogin {
  constructor(
    private readonly userQueryRepository: IUserQueryRepository,
    private readonly passwordQueryRepository: IPasswordQueryRepository,
    private readonly tokenService: TokenService
  ) {}

  public async execute(email: Email, password: string): Promise<{
    user: User,
    token: string
  }> {
    const user = await this.userQueryRepository.getByEmail(email)
    
    const userPassword = await this.passwordQueryRepository.find({ userId: user.getId().toString(), active: true })
    
    if (!userPassword) {
      throw new Error("User password not found")
    }

    const isPasswordValid = await PasswordHasher.verifyPassword(
      password,
      userPassword.getPassword().toString()
    )

    if (!isPasswordValid) {
      throw new Error("Invalid credentials")
    }

    const userId = user.getId()
    const token = this.tokenService.generateTokenForUser(userId)

    return {
      user: user,
      token
    }
  }
}

