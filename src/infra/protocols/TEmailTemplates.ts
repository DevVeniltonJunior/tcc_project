export enum EmailTemplateType {
  PASSWORD_RESET = "PASSWORD_RESET",
  WELCOME = "WELCOME",
  GENERIC = "GENERIC"
}

export type TemplateParams = {
  [EmailTemplateType.PASSWORD_RESET]: { resetLink: string }
  [EmailTemplateType.WELCOME]: { username: string }
  [EmailTemplateType.GENERIC]: { message: string }
}

export type EmailTemplate = {
  subject: string
  text: string
  html: string
}
