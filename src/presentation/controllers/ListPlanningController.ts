import { ListPlanning } from '@/domain/usecases'
import { PlanningQueryRepository } from '@/infra/repositories'
import { TListPlanning, TRoute, Response } from '@/presentation/protocols'
import { BadRequestError } from '@/presentation/exceptions'
import { InvalidParam } from '@/domain/exceptions'

export class ListPlanningController {
  /**
   * @swagger
   * /plannings:
   *   get:
   *     summary: List Planning
   *     tags: [Plannings]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: id
   *         schema:
   *           type: string
   *         required: false
   *         example: "2acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *       - in: query
   *         name: userId
   *         schema:
   *           type: string
   *         required: false
   *         example: "2acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *       - in: query
   *         name: name
   *         schema:
   *           type: string
   *         required: false
   *         example: "Car"
   *       - in: query
   *         name: goal
   *         schema:
   *           type: string
   *         required: false
   *         example: "mazda miata"
   *       - in: query
   *         name: goalValue
   *         schema:
   *           type: number
   *         required: false
   *         example: 120.25
   *       - in: query
   *         name: description
   *         schema:
   *           type: string
   *         required: false
   *         example: "Buy a car"
   *       - in: query
   *         name: plan
   *         schema:
   *           type: string
   *         required: false
   *         example: "Save money"
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
   *         description: List Planning
   *         content:
   *           application/json:
   *             schema:
   *                 type: array
   *                 description: List of Plannings (TPlanning.Entity[])
   *                 items:
   *                    type: object
   *                    properties:
   *                     id:
   *                       type: string
   *                       example: "2acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *                     userId:
   *                       type: string
   *                       example: "2acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *                     name:
   *                       type: string
   *                       example: "Car"
   *                     goal:
   *                       type: string
   *                       example: "Mazda miata"
   *                     goalValue:
   *                       type: number
   *                       example: 90000.00
   *                     description:
   *                       type: string
   *                       nullable: true
   *                       example: "Buy a car"
   *                     plan:
   *                       type: string
   *                       nullable: true
   *                       example: "Save money"
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                     updatedAt:
   *                       type: string
   *                       nullable: true
   *                       format: date-time
   *                     deletedAt:
   *                       type: string
   *                       nullable: true
   *                       format: date-time
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
  public static async handle(req: TRoute.handleParams<TListPlanning.Request.body, TListPlanning.Request.params, TListPlanning.Request.query>): Promise<Response<TListPlanning.Response>> {
    try {
      const filters = req.query
      const userId = req.userId
      
      if (!userId) throw new BadRequestError("User ID not found in authentication token")
      
      // Override userId from query with authenticated userId
      filters.userId = userId
      
      if (filters.goalValue !== undefined) {
        const goalValue = Number(filters.goalValue)
        if (Number.isNaN(goalValue)) throw new BadRequestError("Query parameter 'goalValue' must be a valid number")

        filters.goalValue = goalValue
      }

      const findPlanning = new ListPlanning(new PlanningQueryRepository())

      const entity = await findPlanning.execute(filters)
  
      return {
        statusCode: 200,
        data: entity.map(Planning => Planning.toJson())
      }
    } catch(err: any) {
      console.log(err.stack)
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