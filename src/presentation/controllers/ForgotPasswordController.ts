import { FindUser, ForgotPassword } from '@/domain/usecases'
import { UserQueryRepository } from '@/infra/repositories'
import { TRoute, Response, TForgotPassword } from '@/presentation/protocols'
import { BadRequestError, NotFoundError } from '@/presentation/exceptions'
import { InvalidParam } from '@/domain/exceptions'
import { DatabaseException } from '@/infra/exceptions'
import { EmailService, TokenService } from '@/infra/utils'

export class ForgotPasswordController {
  /**
   * @swagger
   * /forgot-password:
   *   post:
   *     summary: Send email to reset password
   *     tags: [Password]
   *     parameters:
   *       - in: query
   *         name: email
   *         schema:
   *           type: string
   *         required: true
   *         description: User email
   *         example: "jane_doe@email.com"
   *     responses:
   *       200:
   *         description: "Sent email to reset password"
   *         content:
   *           application/json:
   *             example:
   *               message: "Email sent successfully"
   *       400:
   *         description: Bad Request
   *         content:
   *           application/json:
   *             example:
   *               error: "Missing required parameter: email"
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
  public static async handle(req: TRoute.handleParams<TForgotPassword.Request.body, TForgotPassword.Request.params, TForgotPassword.Request.query>): Promise<Response<TForgotPassword.Response>> {
    try {
      const email = req.query.email

      if (!email) throw new BadRequestError("Missing required parameter: email")

      const user = await new FindUser(new UserQueryRepository()).execute({ email: email })
      if (!user) throw new NotFoundError("User not found")

      const forgotPassword = new ForgotPassword(new TokenService(), new EmailService())

      await forgotPassword.execute(user)
  
      return {
        statusCode: 200,
        data: { message: 'Email sent successfully' }
      }
    } catch(err: any) {
      console.log(err.stack)
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