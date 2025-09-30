export class BaseError extends Error {
  statusCode: number;

  constructor(param: string, statusCode: number, name?: string) {
    super(param);
    this.name = name ?? "BaseError";
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends BaseError {
  constructor(param: string) {
    super(param, 400, "Bad Request");
  }
}

export class UnauthorizedError extends BaseError {
  constructor(param: string) {
    super(param, 401, "Unauthorized");
  }
}

export class ForbiddenError extends BaseError {
  constructor(param: string) {
    super(param, 403, "Forbidden Error");
  }
}

export class NotFoundError extends BaseError {
  constructor(param: string) {
    super(param, 404, "Not Found Error");
  }
}

export class InternalServerError extends BaseError {
  constructor(param: string) {
    super(param, 500, "Internal Server Error");
  }
}
