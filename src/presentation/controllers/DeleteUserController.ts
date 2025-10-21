import { DeleteUser, FindUser } from '@/domain/usecases'
import { Id, Bool } from '@/domain/valueObjects'
import { UserCommandRepository, UserQueryRepository } from '@/infra/repositories'
import { TDeleteUser, TRoute, Response } from '@/presentation/protocols'
import { BadRequestError, NotFoundError } from '@/presentation/exceptions'
import { InvalidParam } from '@/domain/exceptions'
import { DatabaseException } from '@/infra/exceptions'

export class DeleteUserController {
  /**
   * @swagger
   * /users/{id}:
   *   delete:
   *     summary: Delete User
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: User to be deleted
   *         example: "2acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *       - in: query
   *         name: permanent
   *         schema:
   *           type: string
   *         required: false
   *         description: Soft or hard delete
   *         example: "true"
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
      const userId = req.userId
      const permanent = req.query.permanent
      const isPermanent = permanent ? permanent === "true" : false

      if (!userId) throw new BadRequestError("User ID not found in authentication token")
      if (!id) throw new BadRequestError("Mising required parameter: Id")
      
      // Security check: users can only delete their own account
      if (id !== userId) {
        throw new BadRequestError("You don't have permission to delete this user")
      }

      const user = await new FindUser(new UserQueryRepository()).execute({ id: id })
      if (!user) throw new NotFoundError("User not found")

      const deleteUser = new DeleteUser(new UserCommandRepository())

      await deleteUser.execute(new Id(id), new Bool(isPermanent))
  
      return {
        statusCode: 200,
        data: { message: 'User deleted successfully' }
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