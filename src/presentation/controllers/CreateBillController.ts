import { Bill } from '@/domain/entities'
import { CreateBill, FindUser } from '@/domain/usecases'
import { Id, Name, DateEpoch, MoneyValue, Description, InstallmentsNumber } from '@/domain/valueObjects'
import { BillCommandRepository, UserQueryRepository } from '@/infra/repositories'
import { TCreateBill, TRoute, Response } from '@/presentation/protocols'
import { validateRequiredFields } from "@/presentation/utils"
import { BadRequestError } from '@/presentation/exceptions'
import { InvalidParam } from '@/domain/exceptions'

export class CreateBillController {
  /**
   * @swagger
   * /bills:
   *   post:
   *     summary: Create Bill
   *     tags: [Bills]
   *     requestBody:    
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - userId
   *               - value
   *             properties:
   *               userId:
   *                 type: string
   *                 example: "2acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *               name:
   *                 type: string
   *                 example: "Internet"
   *               value:
   *                 type: number
   *                 example: 120.25
   *               description:
   *                 type: string
   *                 example: "Internet Bill"
   *               installmentsNumber:
   *                 type: number
   *                 example: 2
   *     responses:
   *       201:
   *         description: User created
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
   *                     type: string
   *                     nullable: true
   *                     example: 2
   *                   createdAt:
   *                     type: string
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
  public static async handle(req: TRoute.handleParams<TCreateBill.Request.body, TCreateBill.Request.params, TCreateBill.Request.query>): Promise<Response<TCreateBill.Response>> {
    try {
      const billParam = req.body
      console.log(billParam)
      validateRequiredFields<TCreateBill.Request.body>(billParam, ["name", "userId", "value"])

      const user = new FindUser(new UserQueryRepository()).execute({ id: billParam.userId})
      if (!user) throw new BadRequestError("User not found")

      const createBill = new CreateBill(new BillCommandRepository())

      const entity = await createBill.execute(new Bill(
          Id.generate(),
          new Id(billParam.userId),
          new Name(billParam.name),
          new MoneyValue(billParam.value),
          new DateEpoch(new Date()),
          billParam.description ? new Description(billParam.description) : undefined,
          billParam.installmentsNumber ? new InstallmentsNumber(billParam.installmentsNumber) : undefined,
      ))
  
      return {
        statusCode: 201,
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