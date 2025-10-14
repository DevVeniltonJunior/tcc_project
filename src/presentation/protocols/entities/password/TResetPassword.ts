export namespace TResetPassword {
  export namespace Request {
    export type params = object
    export type body = {
      newPassword: string
    }
    export type query = {
      token: string
    }
  }
  export type Response = any
}