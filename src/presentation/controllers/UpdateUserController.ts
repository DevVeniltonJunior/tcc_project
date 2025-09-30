import { UpdateUser } from '@/domain/usecases'
import { Id, Name, Email, DateEpoch, MoneyValue } from '@/domain/valueObjects'
import { UserCommandRepository } from '@/infra/repositories'
import { TUpdateUser, TRoute, Response } from '@/presentation/protocols'
import { validateRequiredFields } from "@/presentation/utils"
import { BadRequestError } from '@/presentation/exceptions'
import { InvalidParam } from '@/domain/exceptions'
import { UserDTO } from '@/domain/dtos'

export class UpdateUserController {
  /**
   * @swagger
   * /users:
   *   put:
   *     summary: Update User
   *     tags: [Users]
   *     requestBody:    
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - id
   *             properties:
   *               id:
   *                 type: string
   *                 example: 2acee5ff-d55b-47a8-9caf-bece2ba102db23
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
      validateRequiredFields<TUpdateUser.Request.body>(userParam, ["id"])
      
      const updateUser = new UpdateUser(new UserCommandRepository())
      
      await updateUser.execute(new UserDTO(
        new Id(userParam.id),
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
      if (err instanceof BadRequestError || err instanceof InvalidParam) return {
        statusCode: 400,
        data: { error: err.message }
      }

      return {
        statusCode: 500,
        data: { error: err.message }
      }
    }
  }
}