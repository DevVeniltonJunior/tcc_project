import nodemailer from "nodemailer"
import { EmailTemplates, EmailService } from "@/infra/utils"
import { EmailTemplateType } from "@/infra/protocols"

describe("[Utils] EmailService Integration Test", () => {
  let etherealAccount: any
  let emailService: EmailService

  beforeAll(async () => {
    etherealAccount = await nodemailer.createTestAccount()

    emailService = new EmailService(
      etherealAccount.smtp.host,
      etherealAccount.smtp.port,
      etherealAccount.user,
      etherealAccount.pass
    )
  })

  it("should send a password reset email using the template", async () => {
    const resetLink = "https://example.com/reset?token=123"

    const template = EmailTemplates.getTemplate(EmailTemplateType.PASSWORD_RESET, { resetLink })

    const transporter = (emailService as any).transporter

    const info = await transporter.sendMail({
      from: "sender@test.com",
      to: etherealAccount.user,
      subject: template.subject,
      text: template.text,
      html: template.html,
    })

    const previewUrl = nodemailer.getTestMessageUrl(info)

    expect(info.accepted).toContain(etherealAccount.user)
  }, 10000)

  it("should send a welcome email using the template", async () => {
    const username = "JohnDoe"

    const template = EmailTemplates.getTemplate(EmailTemplateType.WELCOME, { username })

    const transporter = (emailService as any).transporter

    const info = await transporter.sendMail({
      from: "sender@test.com",
      to: etherealAccount.user,
      subject: template.subject,
      text: template.text,
      html: template.html,
    })

    const previewUrl = nodemailer.getTestMessageUrl(info)

    expect(info.accepted).toContain(etherealAccount.user)
  }, 10000)
})
