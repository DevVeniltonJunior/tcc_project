import { Password } from '@/domain/entities'
import { CreatePassword, FindUser } from '@/domain/usecases'
import { Id, DateEpoch, PasswordHash, Bool } from '@/domain/valueObjects'
import { PasswordCommandRepository, UserCommandRepository, UserQueryRepository } from '@/infra/repositories'
import { TCreatePassword, TRoute, Response } from '@/presentation/protocols'
import { validateRequiredFields } from "@/presentation/utils"
import { BadRequestError, NotFoundError } from '@/presentation/exceptions'
import { InvalidParam } from '@/domain/exceptions'
import { PasswordHasher } from '@/infra/utils/PasswordHasher'
import { DatabaseException } from '@/infra/exceptions'

export class CreatePasswordController {
  /**
   * @swagger
   * /password:
   *   post:
   *     summary: Create Password
   *     tags: [Password]
   *     security:
   *       - bearerAuth: []
   *     requestBody:    
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - password
   *             properties:
   *                   password:
   *                     type: string
   *                     example: "12345678"
   *     responses:
   *       201:
   *         description: Password created
   *         content:
   *           application/json:
   *             example:
   *               message: "Password created successfully"
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             example:
   *               error: "Internal Server Error"
   *       400:
   *         description: Bad Request
   *         content:
   *           application/json:
   *             example:
   *               error: "Mising required parameter: id"
   */
  public static async handle(req: TRoute.handleParams<TCreatePassword.Request.body, TCreatePassword.Request.params, TCreatePassword.Request.query>): Promise<Response<TCreatePassword.Response>> {
    try {
      const passwordParam = req.body
      const userId = req.userId

      if (!userId) throw new BadRequestError("User ID not found in authentication token")
      validateRequiredFields<TCreatePassword.Request.body>(passwordParam, ["password"])

      const user = await new FindUser(new UserQueryRepository()).execute({ id: userId })
      if (!user) throw new NotFoundError("User not found")

      const createPassword = new CreatePassword(new PasswordCommandRepository())

      await createPassword.execute(new Password(
          Id.generate(),
          new Id(userId),
          new PasswordHash(await PasswordHasher.encrypt(passwordParam.password)),
          new Bool(true),
          new DateEpoch(new Date())
      ))
  
      return {
        statusCode: 201,
        data: {message: "Password created successfully"}
      }
    } catch(err: any) {
      console.log(err.stack)
      if (err instanceof BadRequestError || err instanceof InvalidParam) return {
        statusCode: 400,
        data: { error: err.message }
      }

      if (err instanceof NotFoundError || (err instanceof DatabaseException && err.message === "User not found")) return {
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