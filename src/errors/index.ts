// ─────────────────────────────────────────────
// Pulsarpay SDK — Errors
// ─────────────────────────────────────────────

export class PulsarpayError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly raw?: unknown
  ) {
    super(message);
    this.name = "PulsarpayError";
    Object.setPrototypeOf(this, PulsarpayError.prototype);
  }
}

/** 400 — Validation or logic error (e.g. currency mismatch, missing fields). */
export class PulsarpayBadRequestError extends PulsarpayError {
  constructor(message: string, raw?: unknown) {
    super(message, 400, raw);
    this.name = "PulsarpayBadRequestError";
    Object.setPrototypeOf(this, PulsarpayBadRequestError.prototype);
  }
}

/** 401 — Invalid, missing, or disabled agent key. */
export class PulsarpayUnauthorizedError extends PulsarpayError {
  constructor(message: string, raw?: unknown) {
    super(message, 401, raw);
    this.name = "PulsarpayUnauthorizedError";
    Object.setPrototypeOf(this, PulsarpayUnauthorizedError.prototype);
  }
}

/** 402 — User has insufficient funds for the charge. */
export class PulsarpayInsufficientFundsError extends PulsarpayError {
  constructor(message: string, raw?: unknown) {
    super(message, 402, raw);
    this.name = "PulsarpayInsufficientFundsError";
    Object.setPrototypeOf(this, PulsarpayInsufficientFundsError.prototype);
  }
}

/** 404 — Resource not found (e.g. charge ID does not exist). */
export class PulsarpayNotFoundError extends PulsarpayError {
  constructor(message: string, raw?: unknown) {
    super(message, 404, raw);
    this.name = "PulsarpayNotFoundError";
    Object.setPrototypeOf(this, PulsarpayNotFoundError.prototype);
  }
}

/** 409 — Conflict, typically a duplicate unique field (e.g. agent name). */
export class PulsarpayConflictError extends PulsarpayError {
  constructor(message: string, raw?: unknown) {
    super(message, 409, raw);
    this.name = "PulsarpayConflictError";
    Object.setPrototypeOf(this, PulsarpayConflictError.prototype);
  }
}

/** Network or timeout error (no HTTP response received). */
export class PulsarpayNetworkError extends PulsarpayError {
  constructor(message: string, raw?: unknown) {
    super(message, undefined, raw);
    this.name = "PulsarpayNetworkError";
    Object.setPrototypeOf(this, PulsarpayNetworkError.prototype);
  }
}
