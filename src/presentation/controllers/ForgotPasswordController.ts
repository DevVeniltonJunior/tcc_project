import { DeleteUser, FindUser } from '@/domain/usecases'
import { Id, Bool } from '@/domain/valueObjects'
import { UserCommandRepository, UserQueryRepository } from '@/infra/repositories'
import { TDeleteUser, TRoute, Response } from '@/presentation/protocols'
import { BadRequestError, NotFoundError } from '@/presentation/exceptions'
import { InvalidParam } from '@/domain/exceptions'
import { DatabaseException } from '@/infra/exceptions'

export class ForgotPasswordController {
  /**
   * @swagger
   * /password:
   *   post:
   *     summary: Reset user's password
   *     tags: [Password]
   *     parameters:
   *       - in: path
   *         name: email
   *         schema:
   *           type: string
   *         required: true
   *         description: User email
   *         example: "jane_doe@email.com"
   *     responses:
   *       200:
   *         description: "Sended email to reset password"
   *         content:
   *           application/json:
   *             example:
   *               message: "Email sended"
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
  public static async handle(req: TRoute.handleParams<TDeleteUser.Request.body, TDeleteUser.Request.params, TDeleteUser.Request.query>): Promise<Response<TDeleteUser.Response>> {
    try {
      const id = req.params.id
      const permanent = req.query.permanent
      const isPermanent = permanent ? permanent === "true" : false

      if (!id) throw new BadRequestError("Mising required parameter: Id")

      const user = await new FindUser(new UserQueryRepository()).execute({ id: id })
      if (!user) throw new NotFoundError("User not found")

      const deleteUser = new DeleteUser(new UserCommandRepository())

      await deleteUser.execute(new Id(id), new Bool(isPermanent))
  
      return {
        statusCode: 200,
        data: { message: 'User deleted successfully' }
      }
    } catch(err: any) {
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