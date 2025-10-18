import { DeleteBill, FindBill } from '@/domain/usecases'
import { Bool, Id } from '@/domain/valueObjects'
import { BillCommandRepository, BillQueryRepository } from '@/infra/repositories'
import { TDeleteBill, TRoute, Response } from '@/presentation/protocols'
import { BadRequestError, NotFoundError } from '@/presentation/exceptions'
import { InvalidParam } from '@/domain/exceptions'
import { DatabaseException } from '@/infra/exceptions'

export class DeleteBillController {
  /**
   * @swagger
   * /bills:
   *   delete:
   *     summary: Delete Bill
   *     tags: [Bills]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: Bill to be deleted
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
   *         description: Bill deleted successfully
   *         content:
   *           application/json:
   *             example:
   *               message: "Bill deleted successfully"
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
  public static async handle(req: TRoute.handleParams<TDeleteBill.Request.body, TDeleteBill.Request.params, TDeleteBill.Request.query>): Promise<Response<TDeleteBill.Response>> {
    try {
      const id = req.params.id
      const permanent = req.query.permanent
      const isPermanent = permanent ? permanent === "true" : false

      if (!id) throw new BadRequestError("Mising required parameter: Id")

      const bill = await new FindBill(new BillQueryRepository()).execute({ id: id })
      if (!bill) throw new NotFoundError("Bill not found")

      const deleteBill = new DeleteBill(new BillCommandRepository())

      await deleteBill.execute(new Id(id), new Bool(isPermanent))
  
      return {
        statusCode: 200,
        data: { message: 'Bill deleted successfully' }
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