import { Password, User } from '@/domain/entities'
import { CreateUser } from '@/domain/usecases'
import { Id, Name, Email, DateEpoch, PasswordHash, Bool, MoneyValue } from '@/domain/valueObjects'
import { UserCommandRepository } from '@/infra/repositories'
import { PasswordHasher } from '@/infra/utils/PasswordHasher'
import { TokenService } from '@/infra/utils/TokenService'
import { TRegister, TRoute, Response } from '@/presentation/protocols'
import { validateRequiredFields } from "@/presentation/utils"
import { BadRequestError, NotFoundError, UnauthorizedError } from '@/presentation/exceptions'
import { InvalidParam } from '@/domain/exceptions'
import { DatabaseException } from '@/infra/exceptions'

export class RegisterController {
  /**
   * @swagger
   * /register:
   *   post:
   *     summary: Register a new user
   *     tags: [Authentication]
   *     requestBody:    
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - email
   *               - birthdate
   *               - password
   *             properties:
   *               name:
   *                 type: string
   *                 example: "John Doe"
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "john.doe@email.com"
   *               birthdate:
   *                 type: string
   *                 format: date
   *                 example: "1990-05-15"
   *               password:
   *                 type: string
   *                 format: password
   *                 example: "SecurePass@123"
   *               salary:
   *                 type: number
   *                 nullable: true
   *                 example: 3500.50
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       example: "2acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *                     name:
   *                       type: string
   *                       example: "John Doe"
   *                     email:
   *                       type: string
   *                       example: "john.doe@email.com"
   *                     birthdate:
   *                       type: string
   *                       format: date-time
   *                       example: "1990-05-15"
   *                     salary:
   *                       type: number
   *                       nullable: true
   *                       example: 3500.50
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                 token:
   *                   type: string
   *                   description: JWT authentication token
   *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *       400:
   *         description: Bad Request
   *         content:
   *           application/json:
   *             example:
   *               error: "Missing required parameter: email"
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             example:
   *               error: "Internal Server Error"
   */
  public static async handle(req: TRoute.handleParams<TRegister.Request.body, TRegister.Request.params, TRegister.Request.query>): Promise<Response<TRegister.Response>> {
    try {
      const registerParam = req.body
      
      validateRequiredFields<TRegister.Request.body>(registerParam, ["name", "email", "birthdate", "password"])

      const createUser = new CreateUser(new UserCommandRepository())
      const tokenService = new TokenService()

      const userId = Id.generate()
      const hashedPassword = await PasswordHasher.encrypt(registerParam.password)

      const password = new Password(
        Id.generate(),
        userId,
        new PasswordHash(hashedPassword),
        new Bool(true),
        new DateEpoch(new Date())
      )

      const user = new User(
        userId,
        new Name(registerParam.name),
        new DateEpoch(registerParam.birthdate),
        new Email(registerParam.email),
        new DateEpoch(new Date()),
        password,
        undefined,
        undefined,
        registerParam.salary ? new MoneyValue(registerParam.salary) : undefined
      )

      const createdUser = await createUser.execute(user)
      const token = tokenService.generateTokenForUser(userId)
  
      const userJson = createdUser.toJson()
      
      return {
        statusCode: 201,
        data: {
          user: {
            id: userJson.id,
            name: userJson.name,
            email: userJson.email,
            birthdate: userJson.birthdate,
            salary: userJson.salary ?? undefined,
            createdAt: userJson.createdAt
          },
          token
        }
      }
    } catch(err: any) {
      console.log(err.stack)
      if (err instanceof BadRequestError || err instanceof InvalidParam) return {
        statusCode: 400,
        data: { error: err.message }
      }

      if (err instanceof UnauthorizedError) return {
        statusCode: 401,
        data: { error: err.message }
      }

      if (err instanceof NotFoundError || (err instanceof DatabaseException && err.message.includes("not found"))) return {
        statusCode: 404,
        data: { error: err.message }
      }

      return {
        statusCode: 500,
        data: { error: err.message }
      }
    }
  }
}

