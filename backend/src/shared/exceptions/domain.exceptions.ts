export class DomainException extends Error {
  constructor(
    message: string,
    public readonly code: string = 'DOMAIN_ERROR',
    public readonly statusCode: number = 500,
    public readonly component?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationException extends DomainException {
  constructor(message: string, component?: string) {
    super(message, 'VALIDATION_ERROR', 422, component);
  }
}

export class NotFoundException extends DomainException {
  constructor(message: string, component?: string) {
    super(message, 'NOT_FOUND', 404, component);
  }
}

export class UnauthorizedException extends DomainException {
  constructor(message = 'Unauthorized', component?: string) {
    super(message, 'UNAUTHORIZED', 401, component);
  }
}

export class ForbiddenException extends DomainException {
  constructor(message = 'Forbidden', component?: string) {
    super(message, 'FORBIDDEN', 403, component);
  }
}

export class ConflictException extends DomainException {
  constructor(message: string, component?: string) {
    super(message, 'CONFLICT', 409, component);
  }
}

export class BadRequestException extends DomainException {
  constructor(message: string, component?: string) {
    super(message, 'BAD_REQUEST', 400, component);
  }
}

export class TooManyRequestsException extends DomainException {
  constructor(
    message: string,
    public readonly retryAfter: number,
    component?: string,
  ) {
    super(message, 'TOO_MANY_REQUESTS', 429, component);
  }
}
