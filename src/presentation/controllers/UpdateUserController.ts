import { FindUser, UpdateUser } from '@/domain/usecases'
import { Id, Name, Email, DateEpoch, MoneyValue } from '@/domain/valueObjects'
import { UserCommandRepository, UserQueryRepository } from '@/infra/repositories'
import { TUpdateUser, TRoute, Response } from '@/presentation/protocols'
import { validateRequiredFields } from "@/presentation/utils"
import { BadRequestError, NotFoundError, UnauthorizedError } from '@/presentation/exceptions'
import { InvalidParam } from '@/domain/exceptions'
import { UserDTO } from '@/domain/dtos'
import { DatabaseException } from '@/infra/exceptions'

export class UpdateUserController {
  /**
   * @swagger
   * /users:
   *   put:
   *     summary: Update User
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     requestBody:    
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 nullable: true
   *                 example: Jane Doe
   *               email:
   *                 type: string
   *                 nullable: true
   *                 example: jane_doe@email.com
   *               birthdate:
   *                 type: string
   *                 nullable: true
   *                 format: date
   *                 example: "1995-06-15"
   *               salary:
   *                 type: number
   *                 nullable: true
   *                 example: 2500.63
   *     responses:
   *       200:
   *         description: User updated successfully
   *         content:
   *           application/json:
   *             example:
   *               message: "User updated successfully"
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
  public static async handle(req: TRoute.handleParams<TUpdateUser.Request.body, TUpdateUser.Request.params, TUpdateUser.Request.query>): Promise<Response<TUpdateUser.Response>> {
    try {
      const userParam = req.body
      const userId = req.userId
      
      if (!userId) throw new BadRequestError("User ID not found in authentication token")

      const user = await new FindUser(new UserQueryRepository()).execute({ id: userId })
      if (!user) throw new NotFoundError("User not found")
      
      const updateUser = new UpdateUser(new UserCommandRepository())
      
      await updateUser.execute(new UserDTO(
        new Id(userId),
        userParam.name ? new Name(userParam.name) : undefined,
        userParam.birthdate ? new DateEpoch(userParam.birthdate) : undefined,
        userParam.email ? new Email(userParam.email) : undefined,
        userParam.salary ? new MoneyValue(userParam.salary) : undefined
      ))
  
      return {
        statusCode: 200,
        data: { message: 'User updated successfully' }
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