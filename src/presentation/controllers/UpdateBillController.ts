import { FindBill, UpdateBill } from '@/domain/usecases'
import { Id, Name, MoneyValue, Description, InstallmentsNumber } from '@/domain/valueObjects'
import { BillCommandRepository, BillQueryRepository } from '@/infra/repositories'
import { TUpdateBill, TRoute, Response } from '@/presentation/protocols'
import { validateRequiredFields } from "@/presentation/utils"
import { BadRequestError, NotFoundError } from '@/presentation/exceptions'
import { InvalidParam } from '@/domain/exceptions'
import { BillDTO } from '@/domain/dtos'
import { DatabaseException } from '@/infra/exceptions'

export class UpdateBillController {
  /**
   * @swagger
   * /bills:
   *   put:
   *     summary: Update Bill
   *     tags: [Bills]
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
   *                 example: "Internet"
   *               value:
   *                 type: number
   *                 nullable: true
   *                 example: 120.00
   *               description:
   *                 type: string
   *                 nullable: true
   *                 example: "Internet Bill"
   *               installmentsNumber:
   *                 type: number
   *                 nullable: true
   *                 example: 2
   *     responses:
   *       200:
   *         description: Bill updated successfully
   *         content:
   *           application/json:
   *             example:
   *               message: "Bill updated successfully"
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
  public static async handle(req: TRoute.handleParams<TUpdateBill.Request.body, TUpdateBill.Request.params, TUpdateBill.Request.query>): Promise<Response<TUpdateBill.Response>> {
    try {
      const billParam = req.body
      validateRequiredFields<TUpdateBill.Request.body>(billParam, ["id"])

      const bill = await new FindBill(new BillQueryRepository()).execute({ id: billParam.id })
      if (!bill) throw new NotFoundError("Bill not found")
      
      const updateBill = new UpdateBill(new BillCommandRepository())
      
      await updateBill.execute(new BillDTO(
        new Id(billParam.id),
        billParam.name ? new Name(billParam.name) : undefined,
        billParam.value ? new MoneyValue(billParam.value) : undefined,
        billParam.description ? new Description(billParam.description) : undefined,
        billParam.installmentsNumber ? new InstallmentsNumber(billParam.installmentsNumber) : undefined
      ))
  
      return {
        statusCode: 200,
        data: { message: 'Bill updated successfully' }
      }
    } catch(err: any) {
      if (err instanceof BadRequestError || err instanceof InvalidParam) return {
        statusCode: 400,
        data: { error: err.message }
      }

      if (err instanceof NotFoundError || (err instanceof DatabaseException && err.message === "Bill not found")) return {
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