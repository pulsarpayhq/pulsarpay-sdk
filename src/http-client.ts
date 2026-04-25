// ─────────────────────────────────────────────
// Pulsarpay SDK — HTTP Client
// ─────────────────────────────────────────────

import {
  PulsarpayBadRequestError,
  PulsarpayConflictError,
  PulsarpayError,
  PulsarpayInsufficientFundsError,
  PulsarpayNetworkError,
  PulsarpayNotFoundError,
  PulsarpayUnauthorizedError,
} from "./errors/index.js";

export interface RequestOptions {
  method: "GET" | "POST";
  path: string;
  headers?: Record<string, string>;
  query?: Record<string, string | number | undefined>;
  body?: unknown;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(baseUrl: string, timeout: number) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.timeout = timeout;
  }

  async request<T>(options: RequestOptions): Promise<T> {
    const { method, path, headers = {}, query, body } = options;

    const url = new URL(`${this.baseUrl}${path}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url.toString(), {
        method,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      let data: unknown;
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        const message =
          (data as { error?: string })?.error ??
          `HTTP ${response.status}: ${response.statusText}`;

        switch (response.status) {
          case 400:
            throw new PulsarpayBadRequestError(message, data);
          case 401:
            throw new PulsarpayUnauthorizedError(message, data);
          case 402:
            throw new PulsarpayInsufficientFundsError(message, data);
          case 404:
            throw new PulsarpayNotFoundError(message, data);
          case 409:
            throw new PulsarpayConflictError(message, data);
          default:
            throw new PulsarpayError(message, response.status, data);
        }
      }

      return data as T;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof PulsarpayError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new PulsarpayNetworkError(
          `Request timed out after ${this.timeout}ms`,
          err
        );
      }
      throw new PulsarpayNetworkError(
        `Network request failed: ${(err as Error).message}`,
        err
      );
    }
  }
}
