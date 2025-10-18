import { ListBill } from '@/domain/usecases'
import { BillQueryRepository } from '@/infra/repositories'
import { TListBill, TRoute, Response } from '@/presentation/protocols'
import { BadRequestError } from '@/presentation/exceptions'
import { InvalidParam } from '@/domain/exceptions'

export class ListBillController {
  /**
   * @swagger
   * /bills:
   *   get:
   *     summary: List Bill
   *     tags: [Bills]
   *     security:
   *       - bearerAuth: []
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
   *         description: List Bill
   *         content:
   *           application/json:
   *             schema:
   *                 type: array
   *                 description: List of Bills (TBill.Entity[])
   *                 items:
   *                    type: object
   *                    properties:
   *                     id:
   *                       type: string
   *                       example: "2acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *                     userId:
   *                       type: string
   *                       example: "2acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *                     name:
   *                       type: string
   *                       example: "Internet"
   *                     value:
   *                       type: number
   *                       example: 120.25
   *                     description:
   *                       type: string
   *                       nullable: true
   *                       example: "Internet Bill"
   *                     installmentsNumber:
   *                       type: number
   *                       nullable: true
   *                       example: 2
   *                     createdAt:
   *                       type: string
   *                       format: date-time
   *                     updatedAt:
   *                       type: string
   *                       nullable: true
   *                       format: date-time
   *                     deletedAt:
   *                       type: string
   *                       nullable: true
   *                       format: date-time
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
  public static async handle(req: TRoute.handleParams<TListBill.Request.body, TListBill.Request.params, TListBill.Request.query>): Promise<Response<TListBill.Response>> {
    try {
      const filters = req.query
      const userId = req.userId
      
      if (!userId) throw new BadRequestError("User ID not found in authentication token")
      
      // Override userId from query with authenticated userId
      filters.userId = userId
      
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

      const findBill = new ListBill(new BillQueryRepository())

      const entity = await findBill.execute(filters)
  
      return {
        statusCode: 200,
        data: entity.map(Bill => Bill.toJson())
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