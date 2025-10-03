import { FindBill } from '@/domain/usecases'
import { BillQueryRepository } from '@/infra/repositories'
import { TFindBill, TRoute, Response } from '@/presentation/protocols'
import { BadRequestError } from '@/presentation/exceptions'
import { InvalidParam } from '@/domain/exceptions'

export class FindBillController {
  /**
   * @swagger
   * /bill:
   *   get:
   *     summary: Find Bill
   *     tags: [Bills]
   *     parameters:
   *       - in: query
   *         name: id
   *         schema:
   *           type: string
   *         required: false
   *         example: "2acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *       - in: query
   *         name: userId
   *         schema:
   *           type: string
   *         required: false
   *         example: "2acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *       - in: query
   *         name: name
   *         schema:
   *           type: string
   *         required: false
   *         example: "Internet"
   *       - in: query
   *         name: value
   *         schema:
   *           type: number
   *         required: false
   *         example: 120.25
   *       - in: query
   *         name: description
   *         schema:
   *           type: string
   *         required: false
   *         example: "Internet Bill"
   *       - in: query
   *         name: installmentsNumber
   *         schema:
   *           type: number
   *         required: false
   *         example: 2
   *       - in: query
   *         name: createdAt
   *         schema:
   *           type: string
   *           format: date-time 
   *           example: "1975-09-25T22:57:22.914Z"
   *         required: false
   *       - in: query
   *         name: updatedAt
   *         schema:
   *           type: string
   *           format: date-time 
   *           example: "1975-09-25T22:57:22.914Z"
   *         required: false
   *       - in: query
   *         name: deletedAt
   *         schema:
   *           type: string
   *           format: date-time 
   *           example: "1975-09-25T22:57:22.914Z"
   *         required: false
   *     responses:
   *       200:
   *         description: Find Bill
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
   *                     example: "Internet"
   *                   value:
   *                     type: number
   *                     example: 120.25
   *                   description:
   *                     type: string
   *                     nullable: true
   *                     example: "Internet Bill"
   *                   installmentsNumber:
   *                     type: number
   *                     nullable: true
   *                     example: 2
   *                   createdAt:
   *                     type: string
   *                     format: date-time
   *                   updatedAt:
   *                     type: string
   *                     nullable: true
   *                     format: date-time
   *                   deletedAt:
   *                     type: string
   *                     nullable: true
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
  public static async handle(req: TRoute.handleParams<TFindBill.Request.body, TFindBill.Request.params, TFindBill.Request.query>): Promise<Response<TFindBill.Response>> {
    try {
      const filters = req.query
      
      if (!filters || Object.keys(filters).length === 0) throw new BadRequestError("At least one filter must be provided")

      if (filters.value !== undefined) {
        const value = Number(filters.value)
        if (Number.isNaN(value)) throw new BadRequestError("Query parameter 'value' must be a valid number")

        filters.value = value
      }

      if (filters.installmentsNumber !== undefined) {
        const installmentsNumber = Number(filters.installmentsNumber)
        if (Number.isNaN(installmentsNumber)) throw new BadRequestError("Query parameter 'installmentsNumber' must be a valid number")

        filters.installmentsNumber = installmentsNumber
      }

      const findBill = new FindBill(new BillQueryRepository())

      const entity = await findBill.execute(filters)
  
      return {
        statusCode: 200,
        data: entity.toJson()
      }
    } catch(err: any) {
      if (err instanceof BadRequestError || err instanceof InvalidParam) return {
        statusCode: 400,
        data: { error: err.message }
      }

      return {
        statusCode: 500,
        data: { error: err.message }
      }
    }
  }
}