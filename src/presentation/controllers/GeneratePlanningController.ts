import { FindUser, GeneratePlanning } from '@/domain/usecases'
import { MoneyValue, Description, Goal, Id, Name, Plan, DateEpoch } from '@/domain/valueObjects'
import { BillQueryRepository, PlanningCommandRepository, UserQueryRepository } from '@/infra/repositories'
import { TRoute, Response, TGeneratePlanning } from '@/presentation/protocols'
import { validateRequiredFields } from "@/presentation/utils"
import { BadRequestError, NotFoundError, UnauthorizedError } from '@/presentation/exceptions'
import { InvalidParam } from '@/domain/exceptions'
import { DatabaseException } from '@/infra/exceptions'
import { AIService } from '@/infra/utils'
import { GetBillsSummary } from '@/domain/utils'
import { Planning } from '@/domain/entities'

export class GeneratePlanningController {
  /**
   * @swagger
   * /generate-planning:
   *   post:
   *     summary: Generate AI-powered financial planning
   *     description: |
   *       Generates an AI-powered financial planning based on the user's current financial situation.
   *       
   *       **AI Analysis includes:**
   *       - Income vs expenses analysis
   *       - Spending pattern evaluation
   *       - Savings capacity calculation
   *       - Timeline estimation
   *       - Actionable recommendations
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
   *                  maxLength: 500
   *                  description: |
   *                    Optional description providing additional context about the goal.
   *                    This helps the AI generate more personalized and accurate recommendations.
   *                  example: "I need a reliable car for my new job that starts in 6 months. Looking for something fuel-efficient and within my budget."
   *                goal:
   *                  type: string
   *                  minLength: 1
   *                  maxLength: 200
   *                  description: |
   *                    The specific financial goal you want to achieve.
   *                    Be as specific as possible for better AI recommendations.
   *                  example: "Mazda Miata 2023"
   *                goalValue:
   *                  type: number
   *                  format: double
   *                  minimum: 0.01
   *                  description: |
   *                    The total monetary value needed to achieve the goal.
   *                    Must be a positive number greater than zero.
   *                  example: 90000.00
   *                previousPlanning:
   *                  type: object
   *                  nullable: true
   *                  properties:
   *                    id:
   *                      type: string
   *                      format: uuid
   *                      description: Unique identifier for the previous planning. Use this ID to reference the previous planning in future operations.
   *                      example: "2acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *                    name:
   *                      type: string
   *                      description: Name of the previous planning
   *                      example: "Mazda Miata 2023 Acquisition Plan"
   *                    description:
   *                      type: string
   *                      nullable: true
   *                      description: Description of the previous planning
   *                      example: "This planning was generated to achieve the goal of purchasing a Mazda Miata 2023."
   *                    plan:
   *                      type: string
   *                      description: The plan to achieve the goal. It must to be a list of steps to achieve the goal. Each step must to be a concise and descriptive step. The plan must to be in the user's language and currency. It must to be a detailed plan to achieve the goal. It must to be a list of steps to achieve the goal. Each step must to be a concise and descriptive step. The plan must to be in the user's language and currency.
   *                      example: |
   *                        **Financial Analysis:**
   *                        - Monthly Income: R$ 5,000.00
   *                        - Current Expenses: R$ 3,200.00
   *                        - Available for Savings: R$ 1,800.00
   *                        **Recommended Strategy:**
   *                        - Save R$ 1,500.00 monthly (83% of available income)
   *                        - Maintain R$ 300.00 emergency buffer
   *                        - Target achievement: 60 months (5 years)
   *                        - Review and reduce subscription bills (potential savings: R$ 200/month)
   *                        - Consider additional income sources to accelerate timeline
   *                        - Set up automatic transfer to savings account on payday
   *                        - Monitor progress monthly and adjust as needed
   *
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
   *                     description: Unique identifier for the generated planning. Use this ID to reference the planning in future operations.
   *                     example: "2acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *                   userId:
   *                     type: string
   *                     format: uuid
   *                     description: The authenticated user's unique identifier
   *                     example: "8f3d9a1b-4c2e-4a5f-9b8d-1e2f3a4b5c6d"
   *                   name:
   *                     type: string
   *                     description: AI-generated concise name for the planning, making it easy to identify
   *                     example: "Mazda Miata 2023 Acquisition Plan"
   *                   description:
   *                     type: string
   *                     nullable: true
   *                     description: AI-generated detailed description providing context and overview of the planning strategy
   *                     example: "Comprehensive 24-month savings plan to purchase a Mazda Miata 2023. This plan considers your current income, expenses, and provides a realistic timeline based on your financial capacity."
   *                   goal:
   *                     type: string
   *                     description: The user's financial goal (as provided in the request)
   *                     example: "Mazda Miata 2023"
   *                   goalValue:
   *                     type: number
   *                     format: double
   *                     description: The monetary value of the goal (as provided in the request)
   *                     example: 90000.00
   *                   plan:
   *                     type: string
   *                     description: |
   *                       AI-generated detailed action plan with specific steps, recommendations, and strategies to achieve the goal.
   *                       Includes savings recommendations, expense optimization suggestions, and realistic timelines.
   *                     example: |
   *                       **Financial Analysis:**
   *                       - Monthly Income: R$ 5,000.00
   *                       - Current Expenses: R$ 3,200.00
   *                       - Available for Savings: R$ 1,800.00
   *                       
   *                       **Recommended Strategy:**
   *                       1. Save R$ 1,500.00 monthly (83% of available income)
   *                       2. Maintain R$ 300.00 emergency buffer
   *                       3. Target achievement: 60 months (5 years)
   *                       
   *                       **Action Items:**
   *                       - Review and reduce subscription bills (potential savings: R$ 200/month)
   *                       - Consider additional income sources to accelerate timeline
   *                       - Set up automatic transfer to savings account on payday
   *                       - Monitor progress monthly and adjust as needed
   *                   createdAt:
   *                     type: string
   *                     format: date-time
   *                     description: ISO 8601 timestamp when the planning was created
   *                     example: "2025-10-21T14:30:00.000Z"
   *       400:
   *         description: |
   *           Bad Request - The request cannot be processed due to client error.
   *           
   *           **Common causes:**
   *           - Missing required fields (goal or goalValue)
   *           - Invalid parameter values (negative numbers, empty strings, values exceeding limits)
   *           - User has no salary registered in the system
   *           - Invalid authentication token or missing user ID
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   description: Detailed error message explaining what went wrong
   *             examples:
   *               missingGoal:
   *                 summary: Missing goal parameter
   *                 value:
   *                   error: "Missing required parameter: goal"
   *               missingGoalValue:
   *                 summary: Missing goalValue parameter
   *                 value:
   *                   error: "Missing required parameter: goalValue"
   *               invalidGoalValue:
   *                 summary: Invalid goal value (negative or zero)
   *                 value:
   *                   error: "goalValue is invalid"
   *               noSalary:
   *                 summary: User has no salary registered
   *                 description: User must register a salary before generating a planning
   *                 value:
   *                   error: "User salary not found"
   *               noUserId:
   *                 summary: Missing or invalid authentication token
   *                 value:
   *                   error: "User ID not found in authentication token"
   *       404:
   *         description: |
   *           Not Found - The requested resource does not exist.
   *           
   *           This typically occurs when the authenticated user ID does not correspond to any user in the database.
   *           Verify that the authentication token is valid and the user account exists.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   description: Error message indicating the resource was not found
   *             example:
   *               error: "User not found"
   *       500:
   *         description: |
   *           Internal Server Error - An unexpected error occurred during processing.
   *           
   *           **Possible causes:**
   *           - Database connection issues or query failures
   *           - AI service unavailability or timeout
   *           - Unexpected system errors
   *           - External service failures
   *           
   *           If this error persists, please contact system administrators.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: string
   *                   description: Error message (may be generic for security reasons)
   *             examples:
   *               generic:
   *                 summary: Generic internal error
   *                 value:
   *                   error: "Internal Server Error"
   *               aiServiceError:
   *                 summary: AI service error
   *                 value:
   *                   error: "Failed to generate planning with AI service"
   *               databaseError:
   *                 summary: Database error
   *                 value:
   *                   error: "Database operation failed"
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
        planningParam.description ? new Description(planningParam.description) : undefined,
        planningParam.previousPlanning ? new Planning(
          new Id(planningParam.previousPlanning.id),
          new Id(userId),
          new Name(planningParam.previousPlanning.name),
          new Goal(planningParam.previousPlanning.goal),
          new MoneyValue(planningParam.previousPlanning.goalValue),
          new Plan(planningParam.previousPlanning.plan),
          new DateEpoch(new Date()),
          planningParam.previousPlanning.description ? new Description(planningParam.previousPlanning.description) : undefined
        ) : undefined
      )
  
      return {
        statusCode: 200,
        data: entity.toJson()
      }
    } catch(err: any) {
      console.log(err.stack)
      if (err instanceof BadRequestError || err instanceof InvalidParam) return {
        statusCode: 400,
        data: { error: err.message }
      }

      if (err instanceof UnauthorizedError) return {
        statusCode: 401,
        data: { error: err.message }
      }

      if (err instanceof NotFoundError || (err instanceof DatabaseException && err.message.includes("not found"))) return {
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