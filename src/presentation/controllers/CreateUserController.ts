import { Bill, Password, Planning, User } from '@/domain/entities'
import { CreateUser } from '@/domain/usecases'
import { Id, Name, Email, DateEpoch, MoneyValue, Description, InstallmentsNumber, Goal, Plan, PasswordHash, Bool } from '@/domain/valueObjects'
import { UserCommandRepository } from '@/infra/repositories'
import { TCreateUser, TRoute, Response } from '@/presentation/protocols'
import { validateRequiredFields } from "@/presentation/utils"
import { BadRequestError, NotFoundError, UnauthorizedError } from '@/presentation/exceptions'
import { InvalidParam } from '@/domain/exceptions'
import { DatabaseException } from '@/infra/exceptions'
import { PasswordHasher } from '@/infra/utils/PasswordHasher'

export class CreateUserController {
  /**
   * @swagger
   * /users:
   *   post:
   *     summary: Create User
   *     tags: [Users]
   *     requestBody:    
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - birthdate
   *               - email
   *             properties:
   *                   name:
   *                     type: string
   *                     example: "Jane Doe"
   *                   email:
   *                     type: string
   *                     example: "jane_doe@email.com"
   *                   birthdate:
   *                     type: string
   *                     format: date
   *                     example: "1995-06-15"
   *                   salary:
   *                     type: number
   *                     nullable: true
   *                     example: 2500.63
   *                   password:
   *                     type: object
   *                     nullable: true
   *                     description: User's password
   *                     properties:
   *                        password:
   *                          type: string
   *                          example: "Jorge@123"                      
   *                   bills:
   *                     type: array
   *                     nullable: true
   *                     description: List of bills (TBill.Entity[])
   *                     items:
   *                       type: object
   *                       properties:
   *                          name:
   *                            type: string
   *                            example: "Internet"
   *                          value:
   *                            type: number
   *                            example: 120.25
   *                          description:
   *                            type: string
   *                            example: "Internet Bill"
   *                          installmentsNumber:
   *                            type: number
   *                            example: 2
   *                   planning:
   *                     type: array
   *                     nullable: true
   *                     description: List of bills (TBill.Entity[])
   *                     items:
   *                       type: object
   *                       properties:
   *                         name:
   *                           type: string
   *                           example: "Car"
   *                         description:
   *                           type: string
   *                           example: "Buy a car"
   *                         goal:
   *                           type: string
   *                           example: "Mazda Miata"
   *                         goalValue:
   *                           type: number
   *                           example: 90000.00
   *                         plan:
   *                           type: string
   *                           example: "Save money"
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
   *                   name:
   *                     type: string
   *                     example: "Jane Doe"
   *                   birthdate:
   *                     type: string
   *                     format: date-time
   *                     example: "1995-06-15"
   *                   email:
   *                     type: string
   *                     example: "jane_doe@email.com"
   *                   salary:
   *                     type: number
   *                     nullable: true
   *                     example: 2500.63
   *                   createdAt:
   *                     type: string
   *                     format: date-time
   *                   password:
   *                     type: object
   *                     nullable: true
   *                     description: User's password
   *                     properties:
   *                        id:
   *                          type: string
   *                          example: "3acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *                        userId:
   *                          type: string
   *                          example: "2acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *                        password:
   *                          type: string
   *                          example: "hajs2d1f5s@@ds"
   *                        active:
   *                          type: boolean
   *                          example: true
   *                        createdAt:
   *                          type: string
   *                          format: date-time                      
   *                   bills:
   *                     type: array
   *                     nullable: true
   *                     description: List of bills (TBill.Entity[])
   *                     items:
   *                       type: object
   *                       properties:
   *                          id:
   *                            type: string
   *                            example: "6acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *                          userId:
   *                            type: string
   *                            example: "2acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *                          name:
   *                            type: string
   *                            example: "Internet"
   *                          value:
   *                            type: number
   *                            example: 120.25
   *                          description:
   *                            type: string
   *                            nullable: true
   *                            example: "Internet Bill"
   *                          installmentsNumber:
   *                            type: string
   *                            nullable: true
   *                            example: 2
   *                          createdAt:
   *                            type: string
   *                            format: date-time 
   *                   planning:
   *                     type: array
   *                     nullable: true
   *                     description: List of bills (TBill.Entity[])
   *                     items:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: string
   *                           example: "9acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *                         userId:
   *                           type: string
   *                           example: "2acee5ff-d55b-47a8-9caf-bece2ba102db23"
   *                         name:
   *                           type: string
   *                           example: "Car"
   *                         description:
   *                           type: string
   *                           nullable: true
   *                           example: "Buy a car"
   *                         goal:
   *                           type: string
   *                           example: "Mazda Miata"
   *                         goalValue:
   *                           type: number
   *                           example: 90000.00
   *                         plan:
   *                           type: string
   *                           example: "Save money"
   *                         createdAt:
   *                           type: string
   *                           format: date-time 
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
  public static async handle(req: TRoute.handleParams<TCreateUser.Request.body, TCreateUser.Request.params, TCreateUser.Request.query>): Promise<Response<TCreateUser.Response>> {
    try {
      const userParam = req.body
      
      validateRequiredFields<TCreateUser.Request.body>(userParam, ["name", "birthdate", "email"])

      const createUser = new CreateUser(new UserCommandRepository())

      const userId = Id.generate()
      const entity = await createUser.execute(new User(
        userId,
        new Name(userParam.name),
        new DateEpoch(userParam.birthdate),
        new Email(userParam.email),
        new DateEpoch(new Date()),
        userParam.password ? new Password(
          Id.generate(),
          userId,
          new PasswordHash(await PasswordHasher.encrypt(userParam.password.password)),
          new Bool(true),
          new DateEpoch(new Date())
        ) : undefined,
        userParam.bills ? userParam.bills.map(bill => new Bill(
          Id.generate(),
          userId,
          new Name(bill.name),
          new MoneyValue(bill.value),
          new DateEpoch(new Date()),
          bill.description ? new Description(bill.description) : undefined,
          bill.installmentsNumber ? new InstallmentsNumber(bill.installmentsNumber) : undefined,
        )) : undefined,
        userParam.planning ? userParam.planning.map(planning => new Planning(
          Id.generate(),
          userId,
          new Name(planning.name),
          new Goal(planning.goal),
          new MoneyValue(planning.goalValue),
          new Plan(planning.plan),
          new DateEpoch(new Date()),
          planning.description ? new Description(planning.description) : undefined
        )) : undefined,
        userParam.salary ? new MoneyValue(userParam.salary) : undefined
      ))
  
      return {
        statusCode: 201,
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