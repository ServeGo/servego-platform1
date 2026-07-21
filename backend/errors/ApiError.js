export class ApiError extends Error {
  constructor(status, code, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = status >= 500 ? null : details;
  }
}

export class BadRequestError extends ApiError {
  constructor(code = 'BAD_REQUEST', message = 'Bad request', details = null) {
    super(400, code, message, details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(code = 'UNAUTHORIZED', message = 'Authentication required.') {
    super(401, code, message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(code = 'FORBIDDEN', message = 'You do not have permission to perform this action.') {
    super(403, code, message);
  }
}

export class NotFoundError extends ApiError {
  constructor(code = 'NOT_FOUND', message = 'Resource not found.') {
    super(404, code, message);
  }
}

export class ConflictError extends ApiError {
  constructor(code = 'DUPLICATE_ENTRY', message = 'A record with this value already exists', details = null) {
    super(409, code, message, details);
  }
}

export class TooManyRequestsError extends ApiError {
  constructor(code = 'RATE_LIMIT_EXCEEDED', message = 'Too many requests. Please try again later.') {
    super(429, code, message);
  }
}

export class NotImplementedError extends ApiError {
  constructor(code = 'NOT_IMPLEMENTED', message = 'This feature is not yet implemented.') {
    super(501, code, message);
  }
}
