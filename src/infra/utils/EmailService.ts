import nodemailer, { Transporter } from "nodemailer"
import { ServiceException } from "@/infra/exceptions"

export class EmailService {
  private transporter: Transporter

  constructor(
    private readonly smtpServer?: string,
    private readonly smtpPort?: number,
    private readonly smtpUser?: string,
    private readonly smtpPassword?: string
  ) {
    if (!this.smtpServer) {
      if (!process.env.SMTP_SERVER) throw new ServiceException("EmailService: Missing required service param")
      this.smtpServer = process.env.SMTP_SERVER
    }
    if (!this.smtpPort) {
      if (!process.env.SMTP_PORT) throw new ServiceException("EmailService: Missing required service param")
      this.smtpPort = parseInt(process.env.SMTP_PORT)
    }
    if (!this.smtpUser) {
      if (!process.env.SMTP_USER) throw new ServiceException("EmailService: Missing required service param")
      this.smtpUser = process.env.SMTP_USER
    }
    if (!this.smtpPassword) {
      if (!process.env.SMTP_PASSWORD) throw new ServiceException("EmailService: Missing required service param")
      this.smtpPassword = process.env.SMTP_PASSWORD
    }

    this.transporter = nodemailer.createTransport({
      host: this.smtpServer,
      port: this.smtpPort,
      auth: {
        user: this.smtpUser,
        pass: this.smtpPassword
      }
    })
  }

  public async sendEmail(from: string, to: string, subject: string, text: string, html?: string): Promise <void> {
    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        text,
        html
      })

      if (info.rejected.length > 0) throw new ServiceException(
        `Failed to send email. Rejected recipients: ${info.rejected.join(", ")}`
      )
    }
    catch(err: any) {
      if (err instanceof ServiceException) throw err

      throw new ServiceException(
        `An unexpected error occurred in EmailService: ${err.message}`
      )
    }
  }
}