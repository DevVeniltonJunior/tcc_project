import { Password } from '@/domain/entities'
import { ResetPassword } from '@/domain/usecases'
import { Id, DateEpoch, PasswordHash, Bool } from '@/domain/valueObjects'
import { PasswordCommandRepository, PasswordQueryRepository } from '@/infra/repositories'
import { TResetPassword, TRoute, Response } from '@/presentation/protocols'
import { validateRequiredFields } from "@/presentation/utils"
import { BadRequestError, NotFoundError, UnauthorizedError } from '@/presentation/exceptions'
import { InvalidParam } from '@/domain/exceptions'
import { TokenService, PasswordHasher } from '@/infra/utils'
import { DatabaseException } from '@/infra/exceptions'

export class ResetPasswordController {
  /**
   * @swagger
   * /reset-password:
   *   post:
   *     summary: Reset user password with token
   *     tags: [Password]
   *     parameters:
   *       - in: query
   *         name: token
   *         schema:
   *           type: string
   *         required: true
   *         description: Reset password token received by email
   *         example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *     requestBody:    
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - newPassword
   *             properties:
   *                   newPassword:
   *                     type: string
   *                     example: "newSecurePassword123"
   *     responses:
   *       200:
   *         description: Password reset successfully
   *         content:
   *           application/json:
   *             example:
   *               message: "Password reset successfully"
   *       400:
   *         description: Bad Request
   *         content:
   *           application/json:
   *             example:
   *               error: "Missing required parameter: newPassword"
   *       401:
   *         description: Unauthorized - Invalid or expired token
   *         content:
   *           application/json:
   *             example:
   *               error: "Invalid or expired token"
   *       404:
   *         description: Password not found
   *         content:
   *           application/json:
   *             example:
   *               error: "Active password not found for this user"
   *       500:
   *         description: Internal Server Error
   *         content:
   *           application/json:
   *             example:
   *               error: "Internal Server Error"
   */
  public static async handle(req: TRoute.handleParams<TResetPassword.Request.body, TResetPassword.Request.params, TResetPassword.Request.query>): Promise<Response<TResetPassword.Response>> {
    try {
      const { newPassword } = req.body
      const { token } = req.query

      validateRequiredFields<TResetPassword.Request.body>(req.body, ["newPassword"])
      if (!token) throw new BadRequestError("Missing required parameter: token")

      const tokenService = new TokenService()
      const passwordQueryRepository = new PasswordQueryRepository()
      const passwordCommandRepository = new PasswordCommandRepository()

      let userId: Id
      try {
        userId = tokenService.getUserIdFromToken(token)
      } catch (error) {
        throw new UnauthorizedError("Invalid or expired token")
      }

      // Find current active password for the user
      const oldPassword = await passwordQueryRepository.find({ 
        userId: userId.toString(), 
        active: true 
      })

      if (!oldPassword) {
        throw new NotFoundError("Active password not found for this user")
      }

      const isTokenValid = tokenService.validateToken(userId, token)
      if (!isTokenValid) {
        throw new UnauthorizedError("Invalid or expired token")
      }

      const newPasswordHash = await PasswordHasher.encrypt(newPassword)
      const newPasswordEntity = new Password(
        Id.generate(),
        userId,
        new PasswordHash(newPasswordHash),
        new Bool(true),
        new DateEpoch(new Date())
      )

      // Execute reset password use case
      const resetPassword = new ResetPassword(passwordCommandRepository)
      await resetPassword.execute(newPasswordEntity, oldPassword)
  
      return {
        statusCode: 200,
        data: { message: "Password reset successfully" }
      }
    } catch(err: any) {
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

