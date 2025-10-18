import { User } from "@/domain/entities";
import { IForgotPassword } from "@/domain/protocols";
import { EmailTemplateType } from "@/infra/protocols";
import { EmailService, EmailTemplates, TokenService } from "@/infra/utils";

export class ForgotPassword implements IForgotPassword {
  constructor(private readonly tokenService: TokenService, private readonly emailService: EmailService) {}
  async execute(user: User): Promise<void> {
    const token = this.tokenService.generateTokenForUser(user.getId())
    const email_template = EmailTemplates.getTemplate<EmailTemplateType.PASSWORD_RESET>(EmailTemplateType.PASSWORD_RESET, { resetLink: `${process.env.FRONTEND_URL}/reset-password?token=${token}` })

    await this.emailService.sendEmail(
      "noreply@budgetly.com",
      user.getEmail().toString(),
      email_template.subject,
      email_template.text,
      email_template.html
    )
  }
}