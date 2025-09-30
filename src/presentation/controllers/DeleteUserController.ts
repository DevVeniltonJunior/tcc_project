import { DeleteUser } from '@/domain/usecases'
import { Id, Bool } from '@/domain/valueObjects'
import { UserCommandRepository } from '@/infra/repositories'
import { TDeleteUser, TRoute, Response } from '@/presentation/protocols'
import { BadRequestError } from '@/presentation/exceptions'
import { InvalidParam } from '@/domain/exceptions'

export class DeleteUserController {
  /**
   * @swagger
   * /users:
   *   delete:
   *     summary: Delete User
   *     tags: [Users]
   *     parameters:
   *       - in: query
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: User to be deleted
   *         example: "2acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *     responses:
   *       200:
   *         description: User deleted successfully
   *         content:
   *           application/json:
   *             example:
   *               message: "User Deleted successfully"
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

      return {
        statusCode: 500,
        data: { error: err.message }
      }
    }
  }
}