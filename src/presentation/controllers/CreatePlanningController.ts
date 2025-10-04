import { Planning } from '@/domain/entities'
import { CreatePlanning, FindUser } from '@/domain/usecases'
import { Id, Name, Email, DateEpoch, MoneyValue, Description, InstallmentsNumber, Goal, Plan, PasswordHash, Bool } from '@/domain/valueObjects'
import { PlanningCommandRepository, UserQueryRepository } from '@/infra/repositories'
import { TCreatePlanning, TRoute, Response } from '@/presentation/protocols'
import { validateRequiredFields } from "@/presentation/utils"
import { BadRequestError, NotFoundError } from '@/presentation/exceptions'
import { InvalidParam } from '@/domain/exceptions'
import { PasswordHasher } from '@/infra/utils/PasswordHasher'
import { DatabaseException } from '@/infra/exceptions'

export class CreatePlanningController {
  /**
   * @swagger
   * /plannings:
   *   post:
   *     summary: Create Planning
   *     tags: [Plannings]
   *     requestBody:    
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - userId
   *               - name
   *               - goal
   *               - goalValue
   *               - plan
   *             properties:
   *                userId:
   *                  type: string
   *                  example: "2acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *                name:
   *                  type: string
   *                  example: "Car"
   *                description:
   *                  type: string
   *                  example: "Buy a car"
   *                goal:
   *                  type: string
   *                  example: "Mazda Miata"
   *                goalValue:
   *                  type: number
   *                  example: 90000.00
   *                plan:
   *                  type: string
   *                  example: "Save money"
   *     responses:
   *       201:
   *         description: Planning created
   *         content:
   *           application/json:
   *             schema:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                     example: "2acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *                   userId:
   *                     type: string
   *                     example: "2acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *                   name:
   *                     type: string
   *                     example: "Car"
   *                   description:
   *                     type: string
   *                     nullable: true
   *                     example: "Buy a car"
   *                   goal:
   *                     type: string
   *                     example: "Mazda Miata"
   *                   goalValue:
   *                     type: number
   *                     example: 90000.00
   *                   plan:
   *                     type: string
   *                     example: "Save money"
   *                   createdAt:
   *                     type: string
   *                     format: date-time 
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
  public static async handle(req: TRoute.handleParams<TCreatePlanning.Request.body, TCreatePlanning.Request.params, TCreatePlanning.Request.query>): Promise<Response<TCreatePlanning.Response>> {
    try {
      const planningParam = req.body
      console.log(planningParam)
      validateRequiredFields<TCreatePlanning.Request.body>(planningParam, ["userId", "name", "goal", "goalValue", "plan"])

      const user = await new FindUser(new UserQueryRepository()).execute({ id: planningParam.userId })
      if (!user) throw new NotFoundError("User not found")

      const createPlanning = new CreatePlanning(new PlanningCommandRepository())

      const entity = await createPlanning.execute(new Planning(
          Id.generate(),
          new Id(planningParam.userId),
          new Name(planningParam.name),
          new Goal(planningParam.goal),
          new MoneyValue(planningParam.goalValue),
          new Plan(planningParam.plan),
          new DateEpoch(new Date()),
          planningParam.description ? new Description(planningParam.description) : undefined
      ))
  
      return {
        statusCode: 201,
        data: entity.toJson()
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