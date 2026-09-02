export class AppError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) { super(message, 400); }
}

export class NotFoundError extends AppError {
  constructor(message: string) { super(message, 404); }
}

export class ConflictError extends AppError {
  constructor(message: string) { super(message, 409); }
}

export class AuthenticationError extends AppError {
  constructor(message = "E-mail ou senha inválidos.") { super(message, 401); }
}

export class ForbiddenError extends AppError {
  constructor(message = "Sem permissão para esta operação.") { super(message, 403); }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Muitas tentativas. Aguarde alguns minutos e tente novamente.", public readonly retryAfterSeconds = 15 * 60) { super(message, 429); }
}

export class PayloadTooLargeError extends AppError {
  constructor(message = "Requisição muito grande.") { super(message, 413); }
}
