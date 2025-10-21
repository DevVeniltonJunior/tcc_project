import { TRoute, Response } from "@/presentation/protocols"
import { BadRequestError, NotFoundError, UnauthorizedError } from "@/presentation/exceptions"
import { DatabaseException } from "@/infra/exceptions"
import { InvalidParam } from "@/domain/exceptions"
import { Id } from "@/domain/valueObjects"
import { BillQueryRepository, UserQueryRepository } from "@/infra/repositories"
import { TGetUserSummary } from "@/presentation/protocols"
import { GetUserSummary } from "@/domain/usecases"
import { GetBillsSummary } from "@/domain/utils"

export class GetUserSummaryController {
  /**
   * @swagger
   * /user-summary:
   *   get:
   *     summary: Get user financial summary
   *     description: Returns a summary of user's financial data including bills and balance
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User summary retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 summary:
   *                   type: object
   *                   description: Financial summary data
   *       400:
   *         description: Bad Request
   *         content:
   *           application/json:
   *             example:
   *               error: "Missing required parameter: userId"
   *       404:
   *         description: User not found
   *         content:
   *           application/json:
   *             example:
   *               error: "User not found"
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             example:
   *               error: "Internal Server Error"
   */
  public static async handle(req: TRoute.handleParams<TGetUserSummary.Request.body, TGetUserSummary.Request.params, TGetUserSummary.Request.query>): Promise<Response<TGetUserSummary.Response>> {
    try {
      const userId = req.userId
      if (!userId) throw new BadRequestError("Missing required parameter: userId")

      const getBillsSummary = new GetBillsSummary(new BillQueryRepository())
      
      const getUserSummary = new GetUserSummary(new UserQueryRepository(), getBillsSummary)
      const summary = await getUserSummary.execute(new Id(userId))

      return {
        statusCode: 200,
        data: { summary }
      }
    }
    catch(err: any) {
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