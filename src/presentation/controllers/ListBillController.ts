import { ListBill } from '@/domain/usecases'
import { BillQueryRepository } from '@/infra/repositories'
import { TListBill, TRoute, Response } from '@/presentation/protocols'
import { BadRequestError, NotFoundError, UnauthorizedError } from '@/presentation/exceptions'
import { InvalidParam } from '@/domain/exceptions'
import { DatabaseException } from '@/infra/exceptions'

export class ListBillController {
  /**
   * @swagger
   * /bills:
   *   get:
   *     summary: List Bill (with pagination)
   *     tags: [Bills]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *         required: false
   *         description: Page number (default 1)
   *         example: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *         required: false
   *         description: Number of items per page (default 10)
   *         example: 10
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
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *         required: false
   *         description: Field to sort by (e.g., name, value, createdAt)
   *         example: "createdAt"
   *       - in: query
   *         name: order
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *         required: false
   *         description: Sort order (default asc)
   *         example: "desc"
   *     responses:
   *       200:
   *         description: List Bill with pagination
   *         content:
   *           application/json:
   *             schema:
   *                 type: object
   *                 properties:
   *                   data:
   *                     type: array
   *                     description: List of Bills (TBill.Entity[])
   *                     items:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: string
   *                           example: "2acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *                         userId:
   *                           type: string
   *                           example: "2acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *                         name:
   *                           type: string
   *                           example: "Internet"
   *                         value:
   *                           type: number
   *                           example: 120.25
   *                         description:
   *                           type: string
   *                           nullable: true
   *                           example: "Internet Bill"
   *                         installmentsNumber:
   *                           type: number
   *                           nullable: true
   *                           example: 2
   *                         createdAt:
   *                           type: string
   *                           format: date-time
   *                         updatedAt:
   *                           type: string
   *                           nullable: true
   *                           format: date-time
   *                         deletedAt:
   *                           type: string
   *                           nullable: true
   *                           format: date-time
   *                   pagination:
   *                     type: object
   *                     properties:
   *                       page:
   *                         type: integer
   *                         example: 1
   *                       limit:
   *                         type: integer
   *                         example: 10
   *                       total:
   *                         type: integer
   *                         example: 50
   *                       totalPages:
   *                         type: integer
   *                         example: 5
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
      const { page, limit, sortBy, order, ...filters } = req.query
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

      // Validate and parse pagination parameters
      let pageNumber: number | undefined
      let limitNumber: number | undefined

      if (page !== undefined) {
        pageNumber = Number(page)
        if (Number.isNaN(pageNumber) || pageNumber < 1) {
          throw new BadRequestError("Query parameter 'page' must be a positive number")
        }
      }

      if (limit !== undefined) {
        limitNumber = Number(limit)
        if (Number.isNaN(limitNumber) || limitNumber < 1) {
          throw new BadRequestError("Query parameter 'limit' must be a positive number")
        }
      }
      
      // Validate order parameter
      if (order && order !== 'asc' && order !== 'desc') {
        throw new BadRequestError("Query parameter 'order' must be 'asc' or 'desc'")
      }

      const repository = new BillQueryRepository()
      const result = await repository.listPaginated(filters, { page: pageNumber, limit: limitNumber, sortBy, order })
  
      return {
        statusCode: 200,
        data: {
          data: result.data.map(Bill => Bill.toJson()),
          pagination: result.pagination
        }
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