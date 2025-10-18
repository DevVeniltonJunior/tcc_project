import { DeletePlanning, FindPlanning } from '@/domain/usecases'
import { Bool, Id } from '@/domain/valueObjects'
import { PlanningCommandRepository, PlanningQueryRepository } from '@/infra/repositories'
import { TDeletePlanning, TRoute, Response } from '@/presentation/protocols'
import { BadRequestError, NotFoundError } from '@/presentation/exceptions'
import { InvalidParam } from '@/domain/exceptions'
import { DatabaseException } from '@/infra/exceptions'

export class DeletePlanningController {
  /**
   * @swagger
   * /plannings/{id}:
   *   delete:
   *     summary: Delete Planning
   *     tags: [Plannings]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: Planning to be deleted
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
   *         description: Planning deleted successfully
   *         content:
   *           application/json:
   *             example:
   *               message: "Planning deleted successfully"
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
  public static async handle(req: TRoute.handleParams<TDeletePlanning.Request.body, TDeletePlanning.Request.params, TDeletePlanning.Request.query>): Promise<Response<TDeletePlanning.Response>> {
    try {
      const id = req.params.id
      const permanent = req.query.permanent
      const userId = req.userId
      const isPermanent = permanent ? permanent === "true" : false

      if (!userId) throw new BadRequestError("User ID not found in authentication token")
      if (!id) throw new BadRequestError("Mising required parameter: Id")

      const planning = await new FindPlanning(new PlanningQueryRepository()).execute({ id: id })
      if (!planning) throw new NotFoundError("Planning not found")
      
      // Security check: ensure the planning belongs to the authenticated user
      if (planning.getUserId().toString() !== userId) {
        throw new BadRequestError("You don't have permission to delete this planning")
      }

      const deletePlanning = new DeletePlanning(new PlanningCommandRepository())

      await deletePlanning.execute(new Id(id), new Bool(isPermanent))
  
      return {
        statusCode: 200,
        data: { message: 'Planning deleted successfully' }
      }
    } catch(err: any) {
      if (err instanceof BadRequestError || err instanceof InvalidParam) return {
        statusCode: 400,
        data: { error: err.message }
      }

      if (err instanceof NotFoundError || (err instanceof DatabaseException && err.message === "Planning not found")) return {
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