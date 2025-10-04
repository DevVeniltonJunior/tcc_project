import { EmailTemplates } from "@/infra/utils"
import { EmailTemplateType, TemplateParams } from "@/infra/protocols"

describe("[Utils] EmailTemplates", () => {
  describe("getTemplate", () => {
    it("should return PASSWORD_RESET template with correct subject, text, and html", () => {
      const resetLink = "https://example.com/reset?token=123"
      const template = EmailTemplates.getTemplate(
        EmailTemplateType.PASSWORD_RESET,
        { resetLink } as TemplateParams[EmailTemplateType.PASSWORD_RESET]
      )

      expect(template.subject).toBe("Password Reset Request")
      expect(template.text).toContain(resetLink)
      expect(template.html).toContain(resetLink)
      expect(template.html).toContain("Reset Password")
    })

    it("should return WELCOME template with correct subject, text, and html", () => {
      const username = "JohnDoe"
      const template = EmailTemplates.getTemplate(
        EmailTemplateType.WELCOME,
        { username } as TemplateParams[EmailTemplateType.WELCOME]
      )

      expect(template.subject).toBe("Welcome to Our App!")
      expect(template.text).toContain(username)
      expect(template.html).toContain(username)
      expect(template.html).toContain("Welcome")
    })

    it("should return GENERIC template with correct subject, text, and html", () => {
      const message = "This is a generic notification"
      const template = EmailTemplates.getTemplate(
        EmailTemplateType.GENERIC,
        { message } as TemplateParams[EmailTemplateType.GENERIC]
      )

      expect(template.subject).toBe("Notification")
      expect(template.text).toBe(message)
      expect(template.html).toContain(message)
    })

    it("should default to GENERIC template if unknown type is provided", () => {
      const message = "Fallback message"
      const template = EmailTemplates.getTemplate(
        "UNKNOWN_TYPE" as EmailTemplateType,
        { message } as any
      )

      expect(template.subject).toBe("Notification")
      expect(template.text).toBe(message)
      expect(template.html).toContain(message)
    })
  })
})
