import { IGetUserSummary, IUserQueryRepository, TUserSummary, IGetBillsSummary } from "@/domain/protocols"
import { Id } from "@/domain/valueObjects"

export class GetUserSummary implements IGetUserSummary {
  /**
   * @swagger
   * /user-summary:
   *   get:
   *     summary: Get user summary
   *     description: |
   *       Get a summary of the user's financial situation.
   *     tags: [Users]
   *     responses:
   *       200:
   *         description: User summary successfully retrieved
   *         content:
   *           application/json:
   *             schema:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                     format: uuid
  *                     description: Unique identifier for the user
     *                     example: "2acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *                   name:
   *                     type: string
   *                     description: User's name
   *                     example: "Jane Doe"
   *                   salary:
   *                     type: number
   *                     format: double
   *                     description: User's salary
   *                     example: 2500.63
   *                   billsActiveCount:
   *                     type: number
   *                     description: Number of active bills
   *                     example: 3
   *                   planningsCount:
   *                     type: number
   *                     description: Number of plannings
   *                     example: 2
   *                   totalBillsValueMonthly:
   *                     type: number
   *                     format: double
   *                     description: Total value of monthly bills
   *                     example: 1000.00
   *                   partialValueNextMonth:
   *                     type: number
   *                     format: double
   *                     description: Partial value for next month
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
   *                   error: "Missing required parameter: userId"
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
  constructor(
    private readonly repository: IUserQueryRepository,
    private readonly getBillsSummary: IGetBillsSummary
  ) {}

  public async execute(userId: Id): Promise<TUserSummary> {
    const user = await this.repository.get(userId)

    const billsSummary = await this.getBillsSummary.execute(userId)

    return {
      id: user.getId().toString(),
      name: user.getName().toString(),
      salary: user.getSalary() ? user.getSalary()?.toNumber() : undefined,
      billsActiveCount: billsSummary.billsActiveCount,
      planningsCount: user.getPlanning()?.length || 0,
      totalBillsValueMonthly: billsSummary.totalValue,
      partialValueNextMonth: billsSummary.partialValueNextMonth,
      partialValue2MonthsLater: billsSummary.partialValue2MonthsLater,
      partialValue3MonthsLater: billsSummary.partialValue3MonthsLater,
    }
  }
}