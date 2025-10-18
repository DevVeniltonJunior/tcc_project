import { TRoute, Response } from "@/presentation/protocols"
import { BadRequestError, NotFoundError } from "@/presentation/exceptions"
import { DatabaseException } from "@/infra/exceptions"
import { InvalidParam } from "@/domain/exceptions"
import { Id } from "@/domain/valueObjects"
import { BillQueryRepository, UserQueryRepository } from "@/infra/repositories"
import { TGetUserSummary } from "@/presentation/protocols"
import { GetUserSummary } from "@/domain/usecases"
import { GetBillsSummary } from "@/domain/utils"

export class GetUserSummaryController {
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