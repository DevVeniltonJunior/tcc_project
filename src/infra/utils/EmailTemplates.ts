import { TemplateParams, EmailTemplateType, EmailTemplate } from "@/infra/protocols"

export class EmailTemplates {
  static getTemplate<T extends EmailTemplateType>(
    type: T,
    params: TemplateParams[T]
  ): EmailTemplate {
    switch (type) {
      case EmailTemplateType.PASSWORD_RESET:
        return {
          subject: "Password Reset Request",
          text: `Click the following link to reset your password: ${(params as TemplateParams[EmailTemplateType.PASSWORD_RESET]).resetLink}`,
          html: `
            <h1>Password Reset</h1>
            <p>You requested to reset your password.</p>
            <p>
              <a href="${
                (params as TemplateParams[EmailTemplateType.PASSWORD_RESET])
                  .resetLink
              }" 
              style="background:#007BFF;color:white;padding:10px 15px;border-radius:5px;text-decoration:none">
                Reset Password
              </a>
            </p>
            <p>If you did not request this, please ignore this email.</p>
          `
        }

      case EmailTemplateType.WELCOME:
        return {
          subject: "Welcome to Our App!",
          text: `Hello ${(params as TemplateParams[EmailTemplateType.WELCOME]).username}, welcome aboard!`,
          html: `
            <h1>Welcome, ${(params as TemplateParams[EmailTemplateType.WELCOME])
              .username}!</h1>
            <p>We're excited to have you with us 🎉</p>
          `
        }

      case EmailTemplateType.GENERIC:
      default:
        return {
          subject: "Notification",
          text: (params as TemplateParams[EmailTemplateType.GENERIC]).message,
          html: `<p>${
            (params as TemplateParams[EmailTemplateType.GENERIC]).message
          }</p>`
        }
    }
  }
}
