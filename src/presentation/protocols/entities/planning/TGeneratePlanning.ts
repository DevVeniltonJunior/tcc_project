import { TPlanning } from '@/domain/protocols'

export namespace TGeneratePlanning {
  export namespace Request {
    export type params = object
    export type body = {
      userId: string,
      goal: string,
      goalValue: number,
      description?: string | null | undefined,
    }
    export type query = object
    }
  export type Response = any
}
