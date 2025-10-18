import { FindUser, GeneratePlanning } from '@/domain/usecases'
import { MoneyValue, Description, Goal } from '@/domain/valueObjects'
import { BillQueryRepository, PlanningCommandRepository, UserQueryRepository } from '@/infra/repositories'
import { TRoute, Response, TGeneratePlanning } from '@/presentation/protocols'
import { validateRequiredFields } from "@/presentation/utils"
import { BadRequestError, NotFoundError } from '@/presentation/exceptions'
import { InvalidParam } from '@/domain/exceptions'
import { DatabaseException } from '@/infra/exceptions'
import { AIService } from '@/infra/utils'
import { GetBillsSummary } from '@/domain/utils'

export class GeneratePlanningController {
  /**
   * @swagger
   * /generate-planning:
   *   post:
   *     summary: Generate AI-powered financial planning
   *     description: |
   *       Generates an AI-powered financial planning based on user's salary, bills, and financial goal.
   *       The AI analyzes the user's financial situation and creates a realistic, achievable plan.
   *       Requires the user to have a registered salary.
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
   *               - goal
   *               - goalValue
   *             properties:
   *                description:
   *                  type: string
   *                  nullable: true
   *                  description: Optional description providing more context about the goal
   *                  example: "Buy a car for work commute"
   *                goal:
   *                  type: string
   *                  description: The financial goal the user wants to achieve
   *                  example: "Mazda Miata"
   *                goalValue:
   *                  type: number
   *                  format: double
   *                  minimum: 0.01
   *                  description: The monetary value of the goal
   *                  example: 90000.00
   *     responses:
   *       200:
   *         description: Planning successfully generated with AI recommendations
   *         content:
   *           application/json:
   *             schema:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                     format: uuid
   *                     description: Unique identifier for the generated planning
   *                     example: "2acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *                   userId:
   *                     type: string
   *                     format: uuid
   *                     description: The user's unique identifier
   *                     example: "2acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *                   name:
   *                     type: string
   *                     description: AI-generated name for the planning
   *                     example: "Car Acquisition Plan"
   *                   description:
   *                     type: string
   *                     nullable: true
   *                     description: AI-generated detailed description of the planning
   *                     example: "Comprehensive plan to purchase a Mazda Miata within 24 months"
   *                   goal:
   *                     type: string
   *                     description: The user's financial goal
   *                     example: "Mazda Miata"
   *                   goalValue:
   *                     type: number
   *                     format: double
   *                     description: The monetary value of the goal
   *                     example: 90000.00
   *                   plan:
   *                     type: string
   *                     description: AI-generated detailed action plan to achieve the goal
   *                     example: "Based on your current salary and expenses, save $1,500 monthly. Consider reducing subscription bills to increase savings rate."
   *                   createdAt:
   *                     type: string
   *                     format: date-time
   *                     description: Timestamp when the planning was created
   *                     example: "2025-10-18T14:30:00.000Z"
   *       400:
   *         description: Bad Request - Missing required fields, invalid parameters, or user has no salary registered
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *             examples:
   *               missingField:
   *                 summary: Missing required parameter
   *                 value:
   *                   error: "Missing required parameter: goal"
   *               invalidParam:
   *                 summary: Invalid parameter value
   *                 value:
   *                   error: "goalValue is invalid"
   *               noSalary:
   *                 summary: User has no salary
   *                 value:
   *                   error: "User salary not found"
   *       404:
   *         description: Not Found - User does not exist
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *             example:
   *               error: "User not found"
   *       500:
   *         description: Internal Server Error - Unexpected error during processing or AI generation
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *             example:
   *               error: "Internal Server Error"
   */
  public static async handle(req: TRoute.handleParams<TGeneratePlanning.Request.body, TGeneratePlanning.Request.params, TGeneratePlanning.Request.query>): Promise<Response<TGeneratePlanning.Response>> {
    try {
      const planningParam = req.body
      const userId = req.userId
      
      if (!userId) throw new BadRequestError("User ID not found in authentication token")
      validateRequiredFields<TGeneratePlanning.Request.body>(planningParam, ["goal", "goalValue"])

      const user = await new FindUser(new UserQueryRepository()).execute({ id: userId })
      if (!user) throw new NotFoundError("User not found")
      if (!user.getSalary()) throw new BadRequestError("User salary not found")

      const getBillsSummary = new GetBillsSummary(new BillQueryRepository())

      const generatePlanning = new GeneratePlanning(new PlanningCommandRepository(), getBillsSummary, new AIService())

      const entity = await generatePlanning.execute(
        user,
        new Goal(planningParam.goal),
        new MoneyValue(planningParam.goalValue),
        planningParam.description ? new Description(planningParam.description) : undefined
      )
  
      return {
        statusCode: 200,
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