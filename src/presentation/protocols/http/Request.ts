export namespace TRoute {
  export type handleParams<B, P, Q> = {
    body: B
    params: P
    query: Q
    userId?: string
  }
}