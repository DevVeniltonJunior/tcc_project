export namespace TRegister {
  export namespace Request {
    export type body = {
      name: string
      email: string
      birthdate: string | Date
      password: string
      salary?: number
    }

    export type params = {}

    export type query = {}
  }

  export type Response = any
}


