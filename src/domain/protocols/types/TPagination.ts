export namespace TPagination {
  export type Request = {
    page?: number
    limit?: number
  }

  export type Response<T> = {
    data: T[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
  }
}

