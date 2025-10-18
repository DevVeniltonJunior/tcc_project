import { Login } from '@/domain/usecases/auth/Login'
import { Email } from '@/domain/valueObjects'
import { PasswordQueryRepository, UserQueryRepository } from '@/infra/repositories'
import { TokenService } from '@/infra/utils/TokenService'
import { TLogin, TRoute, Response } from '@/presentation/protocols'
import { validateRequiredFields } from "@/presentation/utils"
import { BadRequestError } from '@/presentation/exceptions'
import { InvalidParam } from '@/domain/exceptions'
import { DatabaseException } from '@/infra/exceptions'

export class LoginController {
  /**
   * @swagger
   * /login:
   *   post:
   *     summary: Authenticate a user and return a JWT token
   *     tags: [Authentication]
   *     requestBody:    
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "john.doe@email.com"
   *               password:
   *                 type: string
   *                 format: password
   *                 example: "SecurePass@123"
   *     responses:
   *       200:
   *         description: Login successful
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
   *                       example: "2acee5ff-d55b-47a8-9caf-bece2ba102db"
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
   *       401:
   *         description: Unauthorized - Invalid credentials
   *         content:
   *           application/json:
   *             example:
   *               error: "Invalid credentials"
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             example:
   *               error: "User not found"
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             example:
   *               error: "Internal Server Error"
   */
  public static async handle(req: TRoute.handleParams<TLogin.Request.body, TLogin.Request.params, TLogin.Request.query>): Promise<Response<TLogin.Response>> {
    try {
      const loginParam = req.body
      
      validateRequiredFields<TLogin.Request.body>(loginParam, ["email", "password"])

      const userQueryRepository = new UserQueryRepository()
      const passwordQueryRepository = new PasswordQueryRepository()
      const tokenService = new TokenService({
        jwtSecret: process.env.JWT_SECRET,
        tokenExpireHours: 24
      })
      
      const login = new Login(userQueryRepository, passwordQueryRepository, tokenService)
      
      const result = await login.execute(new Email(loginParam.email), loginParam.password)
      

      const userJson = result.user.toJson()
      
      return {
        statusCode: 200,
        data: {
          user: {
            id: userJson.id,
            name: userJson.name,
            email: userJson.email,
            birthdate: userJson.birthdate,
            salary: userJson.salary ?? undefined,
            createdAt: userJson.createdAt
          },
          token: result.token
        }
      }
    } catch(err: any) {
      if (err instanceof BadRequestError || err instanceof InvalidParam) {
        return {
          statusCode: 400,
          data: { error: err.message }
        }
      }

      if (err instanceof DatabaseException && err.message.includes("User not found")) {
        return {
          statusCode: 404,
          data: { error: "User not found" }
        }
      }

      if (err.message === "Invalid credentials") {
        return {
          statusCode: 401,
          data: { error: "Invalid credentials" }
        }
      }

      return {
        statusCode: 500,
        data: { error: err.message }
      }
    }
  }
}

