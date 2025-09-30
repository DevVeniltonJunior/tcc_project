import { FindUser } from '@/domain/usecases'
import { UserQueryRepository } from '@/infra/repositories'
import { TFindUser, TRoute, Response } from '@/presentation/protocols'
import { BadRequestError } from '@/presentation/exceptions'
import { InvalidParam } from '@/domain/exceptions'

export class FindUserController {
  /**
   * @swagger
   * /user:
   *   get:
   *     summary: Find User
   *     tags: [Users]
   *     parameters:
   *       - in: query
   *         name: id
   *         schema:
   *           type: string
   *         required: false
   *         example: "2acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *       - in: query
   *         name: name
   *         schema:
   *           type: string
   *         required: false
   *         example: "Jane Doe"
   *       - in: query
   *         name: birthdate
   *         schema:
   *           type: string
   *           format: date-time 
   *           example: "1975-09-25T22:57:22.914Z"
   *         required: false
   *       - in: query
   *         name: email
   *         schema:
   *           type: string
   *         required: false
   *         example: "jane.doe@email.com"
   *       - in: query
   *         name: salary
   *         schema:
   *           type: string
   *         required: false
   *         example: "2500.00"
   *       - in: query
   *         name: createdAt
   *         schema:
   *           type: string
   *           format: date-time 
   *           example: "1975-09-25T22:57:22.914Z"
   *         required: false
   *       - in: query
   *         name: updatedAt
   *         schema:
   *           type: string
   *           format: date-time 
   *           example: "1975-09-25T22:57:22.914Z"
   *         required: false
   *       - in: query
   *         name: deletedAt
   *         schema:
   *           type: string
   *           format: date-time 
   *           example: "1975-09-25T22:57:22.914Z"
   *         required: false
   *     responses:
   *       200:
   *         description: Find User
   *         content:
   *           application/json:
   *             schema:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                     example: "2acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *                   name:
   *                     type: string
   *                     example: "Jane Doe"
   *                   birthdate:
   *                     type: string
   *                     format: date-time
   *                     example: "1995-06-15"
   *                   email:
   *                     type: string
   *                     example: "jane_doe@email.com"
   *                   salary:
   *                     type: number
   *                     nullable: true
   *                     example: 2500.63
   *                   createdAt:
   *                     type: string
   *                     format: date-time
   *                   updatedAt:
   *                     type: string
   *                     format: date-time
   *                     nullable: true
   *                   deletedAt: 
   *                     type: string
   *                     format: date-time
   *                     nullable: true
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
  public static async handle(req: TRoute.handleParams<TFindUser.Request.body, TFindUser.Request.params, TFindUser.Request.query>): Promise<Response<TFindUser.Response>> {
    try {
      const filters = req.query
      
      if (!filters || Object.keys(filters).length === 0) throw new BadRequestError("At least one filter must be provided")

      if (filters.salary !== undefined) {
        const salary = Number(filters.salary)
        if (Number.isNaN(salary)) throw new BadRequestError("Query parameter 'salary' must be a valid number")

        filters.salary = salary
      }

      const findUser = new FindUser(new UserQueryRepository())

      const entity = await findUser.execute(filters)
  
      return {
        statusCode: 200,
        data: entity.toJson()
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