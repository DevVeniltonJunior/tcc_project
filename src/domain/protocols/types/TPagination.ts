export namespace TPagination {
  export type Request = {
    page?: number
    limit?: number
    sortBy?: string
    order?: 'asc' | 'desc'
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

