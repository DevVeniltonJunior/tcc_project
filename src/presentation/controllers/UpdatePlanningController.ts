import { FindPlanning, UpdatePlanning } from '@/domain/usecases'
import { Id, Name, MoneyValue, Description, InstallmentsNumber, Goal, Plan } from '@/domain/valueObjects'
import { PlanningCommandRepository, PlanningQueryRepository } from '@/infra/repositories'
import { TUpdatePlanning, TRoute, Response } from '@/presentation/protocols'
import { validateRequiredFields } from "@/presentation/utils"
import { BadRequestError, NotFoundError } from '@/presentation/exceptions'
import { InvalidParam } from '@/domain/exceptions'
import { PlanningDTO } from '@/domain/dtos'
import { DatabaseException } from '@/infra/exceptions'

export class UpdatePlanningController {
  /**
   * @swagger
   * /plannings:
   *   put:
   *     summary: Update Planning
   *     tags: [Plannings]
   *     security:
   *       - bearerAuth: []
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
   *                 example: "2acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *               name:
   *                 type: string
   *                 nullable: true
   *                 example: "Car"
   *               goal:
   *                 type: string
   *                 nullable: true
   *                 example: "Mazda miata"
   *               goalValue:
   *                 type: number
   *                 nullable: true
   *                 example: 90000.00
   *               plan:
   *                 type: string
   *                 nullable: true
   *                 example: "Save money"
   *               description:
   *                 type: string
   *                 nullable: true
   *                 example: "Buy a car"
   *     responses:
   *       200:
   *         description: Planning updated successfully
   *         content:
   *           application/json:
   *             example:
   *               message: "Planning updated successfully"
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
  public static async handle(req: TRoute.handleParams<TUpdatePlanning.Request.body, TUpdatePlanning.Request.params, TUpdatePlanning.Request.query>): Promise<Response<TUpdatePlanning.Response>> {
    try {
      const planningParam = req.body
      const userId = req.userId
      
      if (!userId) throw new BadRequestError("User ID not found in authentication token")
      validateRequiredFields<TUpdatePlanning.Request.body>(planningParam, ["id"])

      const planning = await new FindPlanning(new PlanningQueryRepository()).execute({ id: planningParam.id })
      if (!planning) throw new NotFoundError("Planning not found")
      
      // Security check: ensure the planning belongs to the authenticated user
      if (planning.getUserId().toString() !== userId) {
        throw new BadRequestError("You don't have permission to update this planning")
      }
      
      const updatePlanning = new UpdatePlanning(new PlanningCommandRepository())
      
      await updatePlanning.execute(new PlanningDTO(
        new Id(planningParam.id),
        planningParam.name ? new Name(planningParam.name) : undefined,
        planningParam.goal ? new Goal(planningParam.goal) : undefined,
        planningParam.goalValue ? new MoneyValue(planningParam.goalValue) : undefined,
        planningParam.plan ? new Plan(planningParam.plan) : undefined,
        planningParam.description ? new Description(planningParam.description) : undefined
      ))
  
      return {
        statusCode: 200,
        data: { message: 'Planning updated successfully' }
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