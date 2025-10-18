export namespace TPassword {
  export type Entity = {
    id: string,
    userId: string,
    password: string,
    active: boolean,
    createdAt: Date | string,
  }

  export type Model = {
    id: string,
    userId: string,
    password: string,
    active: boolean,
    createdAt: Date | string,
  }
}